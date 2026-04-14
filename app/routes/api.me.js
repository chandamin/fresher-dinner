import { json } from "@remix-run/node";
import { prisma } from "../db.server";

export const loader = async ({ request }) => {
  try {

    const cookie = request.headers.get("Cookie");

    if (!cookie) {
      return json({ loggedIn: false });
    }

    // yaha tum apna customer session check kar sakti ho
    const customerId = request.headers.get("x-customer-id");

    if (!customerId) {
      return json({ loggedIn: false });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return json({ loggedIn: false });
    }

    return json({
      loggedIn: true,
      customer
    });

  } catch (error) {
    console.error(error);
    return json({ loggedIn: false });
  }
};