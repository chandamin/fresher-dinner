import { useState } from "react";
import { json } from "@remix-run/node";
import { Page, Card, Tabs, Button, FormLayout, TextField, Select, BlockStack } from "@shopify/polaris";

export const loader = async () => {
  return json({});
};

export default function MenuManagement() {
  const [selectedTab, setSelectedTab] = useState(0);
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const tabs = days.map((d, i) => ({ id: `menu-${d}`, content: d }));

  return (
    <Page 
      title="Menu Management"
      primaryAction={{ content: "Publish Weekly Menu" }}
      secondaryActions={[{ content: "Save as Draft" }]}
    >
      <Card padding="400">
        <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
          <div style={{ paddingTop: "20px" }}>
            <BlockStack gap="400">
              <FormLayout>
                <FormLayout.Group title={`Menu for ${days[selectedTab]} - Adults`}>
                  <TextField label="Dish Name (Adults)" autoComplete="off" />
                  <TextField label="Description / Ingedients" multiline={3} autoComplete="off" />
                  <Select label="Dietary Tags" options={["None", "Vegan", "GF"]} />
                </FormLayout.Group>
                
                <hr style={{ margin: "20px 0", borderTop: "1px solid #ebebeb" }}/>
                
                <FormLayout.Group title={`Menu for ${days[selectedTab]} - Juniors`}>
                  <TextField label="Dish Name (Juniors)" autoComplete="off" />
                  <TextField label="Description" multiline={2} autoComplete="off" />
                </FormLayout.Group>
                
                <Button variant="primary">Save {days[selectedTab]} Menu Day-wise</Button>
              </FormLayout>
            </BlockStack>
          </div>
        </Tabs>
      </Card>
    </Page>
  );
}
