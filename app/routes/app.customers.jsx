import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import db from "../db.server";
import { Page, Card, DataTable, EmptyState, Text, BlockStack } from "@shopify/polaris";

export const loader = async ({ params }) => {
  const collections = await db.savedCollection.findMany({
    where: {
      collectionId: params.collectionId,
    },
  });

  return json({ collections });
};

export default function CollectionProducts() {
  const { collections } = useLoaderData();

  const collectionId = collections[0]?.collectionId;

  const rows = collections.map((item) => [item.id, item.productTitle || "N/A"]);

  return (
    <Page
      title={`Collection: ${collectionId ?? "Unknown"}`}
      backAction={{ content: "Customers", url: "/customers" }}
    >
      <Card>
        {collections.length === 0 ? (
          <EmptyState
            heading="No products found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <Text>No products found in this collection.</Text>
          </EmptyState>
        ) : (
          <BlockStack gap="400">
            <DataTable
              columnContentTypes={["text", "text"]}
              headings={["ID", "Product Title"]}
              rows={rows}
            />
          </BlockStack>
        )}
      </Card>
    </Page>
  );
}