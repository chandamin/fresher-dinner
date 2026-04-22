import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import db from "../db.server";
import AppTabs from "../components/AppTabs";

export const loader = async () => {
    const customers = await db.customer.findMany({
        include: {
            wallet: true,
            orders: true,
            savedCollections: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return json({ customers });
};
