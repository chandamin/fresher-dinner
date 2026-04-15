import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import db from "../db.server";

export const loader = async ({ params }) => {

  const collections = await db.savedCollection.findMany({
    where: {
      collectionId: params.collectionId
    }
  });

  return json({ collections });
};

export default function CollectionProducts() {

  const { collections } = useLoaderData();

  return (
    <div style={{ padding: "20px" }}>
      <h2>Collection ID: {collections[0]?.collectionId}</h2>

      {collections.length === 0 ? (
        <p>No products found</p>
      ) : (
        <ul>
          {collections.map((item) => (
            <li key={item.id}>
              {item.productTitle}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}