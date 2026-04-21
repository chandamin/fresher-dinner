import { json } from "@remix-run/node";
import { useLoaderData } from "react-router";
import { Page, Card, DataTable, Badge, Text } from "@shopify/polaris";

export const loader = async () => {
  // Mocked for now: Customers who chose 0 quantity or fully paused
  const pausedList = [
    { id: 1, name: "Alice Brown", plan: "5 Dinners", pax: 2, lastActivity: "2026-04-18", status: "Paused" },
    { id: 2, name: "Bob Carter", plan: "3 Dinners", pax: 4, lastActivity: "2026-04-12", status: "0 Selection" }
  ];

  return json({ pausedList });
};

export default function PausedCustomers() {
  const { pausedList } = useLoaderData();

  const rows = pausedList.map(item => [
    item.name,
    item.plan,
    item.pax.toString(),
    item.lastActivity,
    <Badge tone="warning">{item.status}</Badge>
  ]);

  return (
    <Page title="Paused / No Selection">
      <Text as="p" paddingBottom="400">
        Customers appearing here have either paused their subscription or chosen 0 quantity for all upcoming meals. Logistics should ignore these correctly.
      </Text>
      <br/>
      <Card padding="0">
        <DataTable
          columnContentTypes={["text", "text", "numeric", "text", "text"]}
          headings={["Customer", "Plan", "Pax", "Last Activity", "Status"]}
          rows={rows}
        />
      </Card>
    </Page>
  );
}
