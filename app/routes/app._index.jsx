import { json } from "@remix-run/node";
import { useLoaderData } from "react-router";
import db from "../db.server";
import { Page, Layout, Card, Text, BlockStack, InlineGrid, Grid } from "@shopify/polaris";

export const loader = async () => {
  // Mock implementations for dashboard counts
  const totalUpcomingMeals = 120; // this would compute sum of quantities for next week
  const activeCustomers = await db.customer.count({
    where: { sellingPlanOrders: { some: {} } }
  });
  const pausedCustomers = 12; // Example static value or derived via logic
  
  const wallets = await db.wallet.findMany();
  const totalWalletBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const mealsPerDay = {
    Monday: 45,
    Tuesday: 30,
    Wednesday: 35,
    Thursday: 50,
    Friday: 60,
  };

  const recentOrdersList = await db.menuOrder.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { customer: true }
  });

  return json({
    totalUpcomingMeals,
    activeCustomers,
    pausedCustomers,
    totalWalletBalance,
    mealsPerDay,
    recentOrdersList
  });
};

export default function Dashboard() {
  const data = useLoaderData();

  return (
    <Page title="Dashboard Overview">
      <Layout>
        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" color="subdued">Next Week Meals</Text>
                  <Text as="p" variant="headingLg">{data.totalUpcomingMeals}</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" color="subdued">Active Subs</Text>
                  <Text as="p" variant="headingLg">{data.activeCustomers}</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" color="subdued">Paused / Zeros</Text>
                  <Text as="p" variant="headingLg">{data.pausedCustomers}</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" color="subdued">Total Balance</Text>
                  <Text as="p" variant="headingLg">${data.totalWalletBalance.toFixed(2)}</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Meals Count per Day</Text>
              <InlineGrid columns={2} gap="400">
                {Object.entries(data.mealsPerDay).map(([day, count]) => (
                  <div key={day} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #ebebeb" }}>
                    <Text as="span">{day}</Text>
                    <Text as="span" fontWeight="bold">{count}</Text>
                  </div>
                ))}
              </InlineGrid>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Recent Orders</Text>
              {data.recentOrdersList.map(order => (
                <div key={order.id} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #ebebeb" }}>
                  <Text as="span">{order.customer?.email || order.customer?.name}</Text>
                  <Text as="span">${order.price.toFixed(2)}</Text>
                </div>
              ))}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}