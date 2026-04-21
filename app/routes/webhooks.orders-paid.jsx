import prisma from "../db.server"; // adjust path to your prisma client

// ---------- helpers ----------
const extractPax = (title) => {
  const match = title.match(/(\d+)\s*pax/i);
  return match ? Number(match[1]) : 1;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- MAIN WEBHOOK HANDLER ----------
// Responds to Shopify in <5s, then does the slow work in the background.
export const action = async ({ request }) => {
  // 1. Read raw body
  let rawBody;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error(":x: Error reading body:", err);
    return new Response("Invalid body", { status: 400 });
  }

  // 2. Parse JSON
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error(":x: JSON Parse Error:", err);
    return new Response("Invalid JSON", { status: 400 });
  }

  // 3. Extract core fields
  const shopifyCustomerId = payload.customer?.id?.toString();
  const email = payload.customer?.email || null;
  const amount = parseFloat(payload.total_price || 0);
  const webhookId = request.headers.get("x-shopify-webhook-id");
  const orderId = payload.id?.toString();

  console.log(":bell: Webhook received:", { webhookId, orderId, shopifyCustomerId, email, amount });

  if (!shopifyCustomerId) {
    console.error(":x: Customer ID missing");
    // Return 200 so Shopify doesn't retry a payload we can never process
    return new Response(
      JSON.stringify({ ok: false, message: "Customer ID missing" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Idempotency guard — ignore duplicate deliveries of the same webhook
  if (webhookId) {
    try {
      await prisma.processedWebhook.create({ data: { webhookId } });
    } catch (err) {
      // Unique constraint violation => already processed
      console.log(":warning: Duplicate webhook ignored:", webhookId);
      return new Response(
        JSON.stringify({ ok: true, duplicate: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 5. Kick off slow work WITHOUT awaiting it
  processOrder({ shopifyCustomerId, email, amount, orderId }).catch((err) => {
    console.error(":x: Async processing failed:", err);
  });

  // 6. Respond to Shopify IMMEDIATELY (well under the 5s timeout)
  return new Response(
    JSON.stringify({ ok: true }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

// ---------- BACKGROUND WORKER ----------
async function processOrder({ shopifyCustomerId, email, amount, orderId }) {
  console.log(":gear: Starting background processing for order:", orderId);

  // A. Upsert customer + wallet
  let customer = await prisma.customer.findUnique({
    where: { shopifyCustomerId },
    include: { wallet: true },
  });

  if (!customer) {
    console.log(":new: Creating new customer + wallet");
    customer = await prisma.customer.create({
      data: {
        shopifyCustomerId,
        email,
        wallet: { create: { balance: amount } },
      },
      include: { wallet: true },
    });
  } else {
    console.log(":arrows_counterclockwise: Existing customer, incrementing wallet balance");
    await prisma.wallet.update({
      where: { customerId: customer.id },
      data: { balance: { increment: amount } },
    });
  }

  // Make sure wallet exists (defensive)
  const wallet =
    customer.wallet ||
    (await prisma.wallet.findUnique({ where: { customerId: customer.id } }));

  if (!wallet) {
    throw new Error("Wallet not found after upsert");
  }

  // B. Record the transaction
  await prisma.transaction.create({
    data: {
      amount,
      type: "CREDIT",
      description: "Subscription purchase",
      walletId: wallet.id,
    },
  });
  console.log(":white_check_mark: Transaction created");

  // C. Fetch Seal subscription (with delay, since Seal takes a moment to index)
  try {
    await delay(10000);

    const SEAL_TOKEN = 'seal_token_0ct6f5ziql9i7kg3z7f7pev1d9o22gvorxuez4s9'; // put this in .env
    if (!SEAL_TOKEN) {
      console.warn(":warning: SEAL_TOKEN not set — skipping Seal fetch");
      return;
    }

    const sealUrl = `https://app.sealsubscriptions.com/shopify/merchant/api/subscriptions?query=${encodeURIComponent(
      email || ""
    )}`;

    const sealResponse = await fetch(sealUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Seal-Token": SEAL_TOKEN,
      },
    });

    const sealData = await sealResponse.json();
    const subscriptions = sealData?.payload?.subscriptions || [];

    if (subscriptions.length === 0) {
      console.log(":warning: No Seal subscriptions found for", email);
      return;
    }

    const latestSub = subscriptions[0];
    console.log(":package: Latest subscription id:", latestSub.id);

    if (!latestSub.items || latestSub.items.length === 0) {
      console.log(":warning: Subscription has no items");
      return;
    }

    // D. Save each subscription item — use the REAL customer (don't shadow!)
    for (const item of latestSub.items) {
      const pax = extractPax(item.title);

      const savedOrder = await prisma.sellingPlanOrder.create({
        data: {
          customerId: customer.id, // real customer id
          shopifyCustomerId, // real shopify customer id
          email,
          title: item.title,
          quantity: Number(item.quantity),
          pax: Number(pax) || 1,
          sellingPlanId: item.selling_plan_id?.toString() || "",
          sellingPlanName: item.selling_plan_name || "",
          totalValue: Number(latestSub.total_value || 0),
        },
      });

      console.log(":white_check_mark: SellingPlanOrder saved:", savedOrder.id);
    }
  } catch (err) {
    console.error(":x: Seal processing error:", err);
  }
}