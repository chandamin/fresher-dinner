import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "react-router";
import { Page, Card, Tabs, DataTable, Button, Badge } from "@shopify/polaris";

// We mock loader for now until the exact schema mappings are built for delivery scheduling
export const loader = async () => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const orders = {
    Monday: [{ id: "101", name: "John Doe", address: "123 Main St", contact: "123-456", pax: 2, menu: "Chicken Salad", slot: "Morning", status: "Pending" }],
    Tuesday: [{ id: "102", name: "Jane Smith", address: "456 Oak Rd", contact: "987-654", pax: 4, menu: "Beef Stew", slot: "Evening", status: "Pending" }],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  };

  return json({ days, orders });
};

export default function DailyOrders() {
  const { days, orders } = useLoaderData();
  const [selected, setSelected] = useState(0);

  const handleTabChange = (selectedTabIndex) => setSelected(selectedTabIndex);

  const tabs = days.map((day, index) => ({
    id: `day-${index}`,
    content: day,
    panelID: `day-panel-${index}`,
  }));

  const currentDay = days[selected];
  const currentOrders = orders[currentDay];

  const rows = currentOrders.map(o => [
    o.name,
    o.address,
    o.contact,
    o.pax.toString(),
    o.menu,
    o.slot,
    <Badge status="info">{o.status}</Badge>
  ]);

  return (
    <Page 
      title="Orders by Delivery Day"
      primaryAction={{ content: `Print Labels (${currentDay})`, icon: "PrintIcon", onAction: () => alert("Printing labels...") }}
      secondaryActions={[{ content: "Export CSV", onAction: () => alert("Exporting...") }]}
    >
      <Card padding="0">
        <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
          {currentOrders.length > 0 ? (
            <DataTable
              columnContentTypes={["text", "text", "text", "numeric", "text", "text", "text"]}
              headings={["Customer", "Address", "Contact", "Pax", "Menu", "Time Slot", "Status"]}
              rows={rows}
            />
          ) : (
            <div style={{ padding: "20px", textAlign: "center" }}>
              No orders found for {currentDay}.
            </div>
          )}
        </Tabs>
      </Card>
    </Page>
  );
}
