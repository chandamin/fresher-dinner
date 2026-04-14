import db from "../db.server";

export const action = async ({ request }) => {
  try {
    const body = await request.json();

    console.log("🔥 SAVE COLLECTION REQUEST:", body);

    const { collectionId, customerId } = body;

    // ============================
    // 1. VALIDATION
    // ============================
    if (!collectionId || !customerId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing collectionId or customerId",
        }),
        { status: 400 }
      );
    }

    const shopifyCustomerId = String(customerId);
    const collection = String(collectionId);

    // ============================
    // 2. FIND OR CREATE CUSTOMER
    // ============================
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
        },
      });
    }

    console.log("✅ Customer ready:", customer.id);

    // ============================
    // 3. SAVE COLLECTION (UPSERT)
    // ============================
    const savedCollection = await db.savedCollection.upsert({
      where: {
        customerId_collectionId: {
          customerId: customer.id,
          collectionId: collection,
        },
      },
      update: {},
      create: {
        customerId: customer.id,
        collectionId: collection,
      },
    });

    console.log("🎯 COLLECTION SAVED:", savedCollection.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Collection saved successfully",
        data: savedCollection,
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ SAVE COLLECTION ERROR:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      { status: 500 }
    );
  }
};