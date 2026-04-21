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
  TextField,
  IndexFilters,
  useSetIndexFiltersMode,
  IndexFiltersMode,
} from "@shopify/polaris";
import { useState } from "react";

export const loader = async ({ request }) => {
  const customers = await db.customer.findMany({
    include: {
      wallet: true,
      orders: true,
      savedCollections: true,
      sellingPlanOrders: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formatted = customers.map((c) => {
    // Determine last used amount or similar for demo
    const totalTransactions = 0; // if you expand wallet transactions later
    
    return {
      id: c.id,
      name: c.name || "N/A",
      email: c.email || "N/A",
      totalBalance: c.wallet?.balance || 0,
      usedAmount: totalTransactions, 
      remainingBalance: c.wallet?.balance || 0,
      nextBillingDate: c.sellingPlanOrders?.length > 0 ? "Next Week" : "No active sub",
      createdAt: new Date(c.createdAt).toISOString().split("T")[0],
    };
  });

  return json({ customers: formatted });
};

export default function WalletsPage() {
  const { customers } = useLoaderData();
  const [queryValue, setQueryValue] = useState("");
  const { mode, setMode } = useSetIndexFiltersMode(IndexFiltersMode.Filtering);

  const handleQueryChange = (value) => setQueryValue(value);
  const handleQueryClear = () => setQueryValue("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(queryValue.toLowerCase()) ||
      c.name.toLowerCase().includes(queryValue.toLowerCase())
  );

  const rows = filteredCustomers.map((customer, index) => [
    customer.name,
    customer.email,
    `$${customer.totalBalance.toFixed(2)}`,
    `$${customer.usedAmount.toFixed(2)}`,
    <Badge tone={customer.remainingBalance > 0 ? "success" : "critical"}>
      ${customer.remainingBalance.toFixed(2)}
    </Badge>,
    customer.nextBillingDate,
  ]);

  return (
    <Page title="Customer Wallets">
      <Card padding="0">
        <div style={{ padding: "16px" }}>
          <TextField
             label="Search customers"
             labelHidden
             value={queryValue}
             onChange={handleQueryChange}
             placeholder="Search by name or email"
             clearButton
             onClearButtonClick={handleQueryClear}
             autoComplete="off"
          />
        </div>
        {filteredCustomers.length === 0 ? (
          <EmptyState
            heading="No wallet records found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Try changing your search query or add new customers.</p>
          </EmptyState>
        ) : (
          <DataTable
            columnContentTypes={["text", "text", "numeric", "numeric", "numeric", "text"]}
            headings={["Name", "Email", "Total Balance", "Used Amount", "Remaining Balance", "Next Billing Date"]}
            rows={rows}
          />
        )}
      </Card>
    </Page>
  );
}
