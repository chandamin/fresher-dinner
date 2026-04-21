import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import db from "../db.server";

export const loader = async ({ params }) => {

  const collections = await db.savedCollection.findMany({
    where: {
      collectionId: params.id
    }
  });

  return json({ collections });
};

// UI

export default function CollectionProducts() {
  const { collection } = useLoaderData();

  const products = collection?.products || [];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Collection: {collection?.collectionTitle}</h2>

      {products.length === 0 ? (
        <p>No products found</p>
      ) : (
        <ul>
          {products.map((item, index) => (
            <li key={index}>
              Product ID: {item.productId} | Qty: {item.quantity}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}