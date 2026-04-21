import { json } from "@remix-run/node";
import { useLoaderData, Link } from "react-router";
import db from "../db.server";
import {
  Page,
  Card,
  DataTable,
  EmptyState,
  Badge,
  Button,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
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

  const formatted = customers.map((c) => ({
    ...c,
    createdAt: new Date(c.createdAt).toISOString().split("T")[0], // "2026-04-15"
  }));

  return json({ customers: formatted });
};

export default function CustomersPage() {
  const { customers } = useLoaderData();

  const rows = customers.map((customer, index) => [
    index + 1,
    customer.email || "N/A",
    customer.wallet?.balance || 0,
    customer.createdAt,
    <Badge tone="info">{String(customer.orders?.length || 0)}</Badge>,
    customer.savedCollections?.length ? (
      customer.savedCollections.map((col) => (
        <Link key={col.id} url={`/collection/${col.collectionId}`}>
          {col.collectionTitle || col.collectionId}
        </Link>
      ))
    ) : (
      <Badge tone="warning">No Menu</Badge>
    ),
  ]);

  return (
    <Page
      title="Customers"
      primaryAction={
        <Button icon={PlusIcon} variant="primary">
          Add Customer
        </Button>
      }
    >
      <Card>
        {customers.length === 0 ? (
          <EmptyState
            heading="No customers found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>No customers have been added yet.</p>
          </EmptyState>
        ) : (
          <DataTable
            columnContentTypes={["text", "text", "text", "text", "text", "text"]}
            headings={["ID", "Email", "Credit", "Created At", "Orders", "Menu"]}
            rows={rows}
          />
        )}
      </Card>
    </Page>
  );
}