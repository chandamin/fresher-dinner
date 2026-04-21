import { Outlet, Link } from "react-router";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function App() {
  return (
    <AppProvider>
      <ui-nav-menu>
        <Link to="/app" rel="home">Dashboard</Link>
        <Link to="/app/orders">Daily Orders</Link>
        <Link to="/app/menus">Menu Management</Link>
        <Link to="/app/wallets">Customer Wallets</Link>
        <Link to="/app/paused">Paused</Link>
      </ui-nav-menu>
      <Outlet />
    </AppProvider>
  );
}