import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {

  const payload = await request.json();

  console.log("ORDER PAID WEBHOOK DATA:");
  console.log(payload);

  return json({ success: true });
  
//   console.log("Webhook data:", payload);

//   return json({ ok: true });

  const shopifyCustomerId = payload.customer?.id?.toString();
  const email = payload.customer?.email;
  const amount = parseFloat(payload.total_price);

  if (!shopifyCustomerId) {
    return json({ ok: false });
  }

  // check customer
  let customer = await prisma.customer.findUnique({
    where: { shopifyCustomerId }
  });

  if (!customer) {

    customer = await prisma.customer.create({
      data: {
        shopifyCustomerId,
        email,
        wallet: {
          create: {
            balance: amount
          }
        }
      }
    });

  } else {

    await prisma.wallet.update({
      where: { customerId: customer.id },
      data: {
        balance: {
          increment: amount
        }
      }
    });

  }

  const wallet = await prisma.wallet.findUnique({
    where: { customerId: customer.id }
  });

  await prisma.transaction.create({
    data: {
      amount,
      type: "CREDIT",
      description: "Subscription purchase",
      walletId: wallet.id
    }
  });

  return json({ success: true });
};