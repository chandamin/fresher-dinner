import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {

  const body = await request.json();

  const shopifyCustomerId = body.customerId;
  const itemName = body.itemName;
  const price = parseFloat(body.price);

  // customer find
  const customer = await prisma.customer.findUnique({
    where: { shopifyCustomerId }
  });

  if (!customer) {
    return json({ error: "Customer not found" });
  }

  // wallet find
  const wallet = await prisma.wallet.findUnique({
    where: { customerId: customer.id }
  });

  if (!wallet) {
    return json({ error: "Wallet not found" });
  }

  // balance check
  if (wallet.balance < price) {
    return json({ error: "Insufficient wallet balance" });
  }

  // wallet balance deduct
  await prisma.wallet.update({
    where: { customerId: customer.id },
    data: {
      balance: {
        decrement: price
      }
    }
  });

  // menu order create
  await prisma.menuOrder.create({
    data: {
      itemName,
      price,
      customerId: customer.id
    }
  });

  // transaction record
  await prisma.transaction.create({
    data: {
      amount: price,
      type: "DEBIT",
      description: `Menu item: ${itemName}`,
      walletId: wallet.id
    }
  });

  return json({ success: true });

};