import prisma from "../db.server";

export const action = async ({ request }) => {
  console.log("🔥 Webhook HIT");

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


    // 🔹 STEP 6: GET THE OREDRE DATA SELLING PRICE AND PLAN etc..
    const SEAL_API_URL = `https://app.sealsubscriptions.com/shopify/merchant/api/subscriptions?query=${email}`;
    const sealResponse = await fetch(SEAL_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Seal-Token": 'seal_token_0ct6f5ziql9i7kg3z7f7pev1d9o22gvorxuez4s9'
      }
    });
    const sealData = await sealResponse.json();
    console.log("****************SEAL API RESPONSE:****************", sealData);

    const subscriptions = sealData?.payload?.subscriptions || [];

    let finalData = [];

    subscriptions.forEach(sub => {
      if (sub.items && Array.isArray(sub.items)) {
        sub.items.forEach(item => {
          finalData.push({
            title: item.title,
            quantity: item.quantity,
            selling_plan_id: item.selling_plan_id,
            selling_plan_name: item.selling_plan_name,
            total_value: sub.total_value
          });
        });
      }
    });

    console.log("******** FINAL DATA:*********", finalData);

    // ✅ SAVE SELLING PLAN DATA
    if (finalData.length > 0) {
      await prisma.sellingPlanOrder.createMany({
        data: finalData.map(item => ({
          customerId: customer.id,
          shopifyCustomerId: shopifyCustomerId,

          title: item.title,
          quantity: item.quantity,

          //  mapping fix (snake → camel)
          sellingPlanId: item.selling_plan_id?.toString() || "",
          sellingPlanName: item.selling_plan_name || null,

          totalValue: parseFloat(item.total_value || 0),
        }))
      });

      console.log("✅ Selling plan data saved in DB");
    }
    console.log("******** FINAL DATA:*********", finalData);








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