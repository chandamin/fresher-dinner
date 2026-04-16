import db from "../db.server";

// 👇 ADD THIS
export const loader = async () => {
  return new Response("OK");
};


export const action = async ({ request }) => {
  try {
    const body = await request.json();

    console.log("🔥 SAVE REQUEST:", body);

    const { collectionId, customerId, collectionTitle, customerName } = body;

    // =========================
    // 1. VALIDATION
    // =========================
    if (!collectionId || !customerId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "collectionId or customerId missing",
        }),
        { status: 400 }
      );
    }

    const shopifyCustomerId = String(customerId);
    const collection = String(collectionId);

    // =========================
    // 2. FIND CUSTOMER (OR CREATE)
    // =========================
    let customer = await db.customer.findUnique({
      where: {
        shopifyCustomerId,
      },
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          shopifyCustomerId,
          email: "",
          name: customerName || "Unknown",
        },
      });
    } else if (customerName && customer.name !== customerName) {
      customer = await db.customer.update({
        where: { shopifyCustomerId },
        data: { name: customerName },
      });
    }

    console.log("✅ CUSTOMER READY:", customer.id);

    // =========================
    // 3. SAVE COLLECTION (YOUR SCHEMA FIX)
    // =========================
    const savedCollection = await db.savedCollection.upsert({
      where: {
        customerId_collectionId: {
          customerId: customer.id,
          collectionId: collection,
        },
      },
      update: {
        collectionTitle: collectionTitle || "Unknown",
      },
      create: {
        customerId: customer.id,
        collectionId: collection,
        collectionTitle: collectionTitle || "Unknown",
      },
    });

    console.log("🎯 SAVED:", savedCollection.id);

    // =========================
    // 4. RESPONSE
    // =========================
    return new Response(
      JSON.stringify({
        success: true,
        message: "Collection saved in DB",
        data: savedCollection,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ SAVE COLLECTION ERROR:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};