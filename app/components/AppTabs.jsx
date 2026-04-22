import { useState } from "react";
import { Tabs, Card, Text } from "@shopify/polaris";

export default function AppTabs() {
    const [selected, setSelected] = useState(0);

    const tabs = [
        {
            id: "customer-wallet",
            content: "Customer Wallet",
            accessibilityLabel: "Customer Wallet",
            panelID: "customer-wallet-panel",
        },
        {
            id: "active-customers",
            content: "Active Customers",
            panelID: "active-customers-panel",
        },
        {
            id: "orders",
            content: "Orders",
            panelID: "orders-panel",
        },
    ];

    return (
        <Card>
            <Tabs tabs={tabs} selected={selected} onSelect={setSelected}>
                <Card.Section>
                    {selected === 0 && <Text as="p">Wallet content goes here</Text>}
                    {selected === 1 && <Text as="p">Active customers data</Text>}
                    {selected === 2 && <Text as="p">Orders list here</Text>}
                </Card.Section>
            </Tabs>
        </Card>
    );
}