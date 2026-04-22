import { Outlet } from "react-router";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function App() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}
