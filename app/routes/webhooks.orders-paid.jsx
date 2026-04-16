import prisma from "../db.server";

export const action = async ({ request }) => {
  console.log("🔥 Webhook HIT hua");

  // 🔹 STEP 1: Get raw body (safe way)
  let rawBody;
  try {
    rawBody = await request.text();
    console.log("📦 RAW BODY:", rawBody);
  } catch (err) {
    console.error("❌ Error reading body:", err);
    return new Response("Invalid body", { status: 400 });
  }

  // 🔹 STEP 2: Parse JSON safely
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error("❌ JSON Parse Error:", err);
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log("✅ Parsed Payload:", payload);

  // 🔹 STEP 3: Extract data
  const shopifyCustomerId = payload.customer?.id?.toString();
  const email = payload.customer?.email || null;
  const amount = parseFloat(payload.total_price || 0);

  console.log("👤 Customer ID:", shopifyCustomerId);
  console.log("📧 Email:", email);
  console.log("💰 Amount:", amount);

  if (!shopifyCustomerId) {
    console.error("❌ Customer ID missing");
    return new Response(
      JSON.stringify({ ok: false, message: "Customer ID missing" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // 🔹 STEP 4: Check customer
    let customer = await prisma.customer.findUnique({
      where: { shopifyCustomerId }
    });

    // 🔹 STEP 5: Create or Update
    if (!customer) {
      console.log("🆕 Creating new customer + wallet");

      customer = await prisma.customer.create({
        data: {
          shopifyCustomerId,
          email,
          wallet: {
            create: {
              balance: amount
            }
          }
        },
        include: { wallet: true }
      });
    } else {
      console.log("🔄 Existing customer, updating wallet");

      await prisma.wallet.update({
        where: { customerId: customer.id },
        data: {
          balance: {
            increment: amount
          }
        }
      });
    }

    // 🔹 STEP 6: Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { customerId: customer.id }
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // 🔹 STEP 7: Create transaction
    await prisma.transaction.create({
      data: {
        amount,
        type: "CREDIT",
        description: "Subscription purchase",
        walletId: wallet.id
      }
    });

    console.log("✅ Transaction created successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ SERVER ERROR:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};