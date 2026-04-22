import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "react-router";
import db from "../db.server";
import {
    Page,
    Card,
    EmptyState,
    Badge,
    Text,
    BlockStack,
    InlineStack,
    Thumbnail,
    Divider,
    Box,
} from "@shopify/polaris";

// ─── Shopify GraphQL query ────────────────────────────────────────────────────
const PRODUCTS_QUERY = `
  query getProductsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        status
        totalInventory
        featuredImage {
          url
          altText
        }
        priceRangeV2 {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 1) {
          edges {
            node {
              sku
              price
              inventoryQuantity
            }
          }
        }
      }
    }
  }
`;

// ─── Loader ───────────────────────────────────────────────────────────────────
export const loader = async ({ params }) => {
    const { collectionId } = params;

    // 1. Get shop + accessToken from Session table (no OAuth needed)
    const session = await db.session.findFirst({
        where: { accessToken: { not: "" } },
        orderBy: { id: "asc" },
    });

    if (!session?.shop || !session?.accessToken) {
        throw new Response("No active Shopify session found", { status: 500 });
    }

    // 2. Get saved collection from DB
    const savedCollection = await db.savedCollection.findFirst({
        where: { collectionId },
        include: {
            customer: { select: { email: true, name: true } },
        },
    });

    if (!savedCollection) {
        throw new Response("Collection not found", { status: 404 });
    }

    // 3. Parse products JSON → [{productId, quantity}, ...]
    let savedProducts = [];
    if (savedCollection.products) {
        savedProducts =
            typeof savedCollection.products === "string"
                ? JSON.parse(savedCollection.products)
                : savedCollection.products;
    }

    if (savedProducts.length === 0) {
        return json({
            collectionTitle: savedCollection.collectionTitle || collectionId,
            customerEmail: savedCollection.customer?.email || null,
            persons: savedCollection.persons,
            products: [],
        });
    }

    // 4. Build Shopify GIDs
    const gids = savedProducts.map(
        (p) => `gid://shopify/Product/${p.productId}`
    );

    // 5. Call Shopify Admin GraphQL directly using session credentials
    const shopifyResponse = await fetch(
        `https://${session.shop}/admin/api/2024-10/graphql.json`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": session.accessToken,
            },
            body: JSON.stringify({
                query: PRODUCTS_QUERY,
                variables: { ids: gids },
            }),
        }
    );

    const { data, errors } = await shopifyResponse.json();

    if (errors) {
        console.error("Shopify GraphQL errors:", errors);
        throw new Response("Failed to fetch products from Shopify", { status: 500 });
    }

    // 6. Merge Shopify data with saved quantity
    const quantityMap = Object.fromEntries(
        savedProducts.map((p) => [p.productId, p.quantity])
    );

    const products = (data?.nodes || [])
        .filter(Boolean)
        .map((node) => {
            const numericId = node.id.replace("gid://shopify/Product/", "");
            const variant = node.variants?.edges?.[0]?.node;
            return {
                id: numericId,
                title: node.title,
                status: node.status,
                image: node.featuredImage?.url || null,
                imageAlt: node.featuredImage?.altText || node.title,
                price:
                    variant?.price ||
                    node.priceRangeV2?.minVariantPrice?.amount ||
                    "0",
                currency:
                    node.priceRangeV2?.minVariantPrice?.currencyCode || "USD",
                sku: variant?.sku || "—",
                inventory: node.totalInventory ?? "—",
                quantity: quantityMap[numericId] || 1,
            };
        });

    return json({
        collectionTitle: savedCollection.collectionTitle || collectionId,
        customerEmail: savedCollection.customer?.email || null,
        persons: savedCollection.persons,
        products,
    });
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const toneMap = { ACTIVE: "success", DRAFT: "warning", ARCHIVED: "critical" };
    const label = status
        ? status.charAt(0) + status.slice(1).toLowerCase()
        : "Unknown";
    return <Badge tone={toneMap[status] || "info"}>{label}</Badge>;
}

// ─── Single product card ──────────────────────────────────────────────────────
function ProductCard({ product }) {
    const totalPrice = (parseFloat(product.price) * product.quantity).toFixed(2);

    return (
        <div
            style={{
                display: "flex",
                gap: "16px",
                padding: "16px",
                alignItems: "flex-start",
                borderRadius: "8px",
                background: "var(--p-color-bg-surface-secondary)",
                transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.10)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
        >
            {/* Thumbnail */}
            <div style={{ flexShrink: 0 }}>
                <Thumbnail
                    source={
                        product.image ||
                        "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    }
                    alt={product.imageAlt}
                    size="large"
                />
            </div>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="start" wrap={false}>
                        <Text variant="headingMd" fontWeight="semibold">
                            {product.title}
                        </Text>
                        <StatusBadge status={product.status} />
                    </InlineStack>

                    <InlineStack gap="400" wrap>
                        {product.sku !== "—" && (
                            <Text variant="bodySm" tone="subdued">
                                SKU: <strong>{product.sku}</strong>
                            </Text>
                        )}
                        <Text variant="bodySm" tone="subdued">
                            Stock: <strong>{product.inventory}</strong>
                        </Text>
                    </InlineStack>

                    <Divider />

                    <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200" blockAlign="center">
                            <Text variant="bodyMd" tone="subdued">
                                {product.currency} {parseFloat(product.price).toFixed(2)}
                            </Text>
                            <Text variant="bodySm" tone="subdued">×</Text>
                            <Badge tone="info">{`Qty: ${product.quantity}`}</Badge>
                        </InlineStack>
                        <Text variant="headingSm" fontWeight="bold">
                            {product.currency} {totalPrice}
                        </Text>
                    </InlineStack>
                </BlockStack>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CollectionProductsPage() {
    const { collectionTitle, customerEmail, persons, products } = useLoaderData();
    const navigate = useNavigate();

    const grandTotal = products
        .reduce((sum, p) => sum + parseFloat(p.price) * p.quantity, 0)
        .toFixed(2);

    const currency = products[0]?.currency || "USD";
    const totalItems = products.reduce((s, p) => s + p.quantity, 0);

    return (
        <Page
            title={collectionTitle}
            subtitle={
                [
                    customerEmail && `Customer: ${customerEmail}`,
                    persons && `Persons: ${persons}`,
                ]
                    .filter(Boolean)
                    .join("  •  ") || undefined
            }
            backAction={{
                content: "Customers",
                onAction: () => navigate(-1),
            }}
        >
            <BlockStack gap="400">
                {/* Summary bar */}
                {products.length > 0 && (
                    <Card>
                        <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="300">
                                <Badge tone="info">{`${products.length} products`}</Badge>
                                <Badge>{`${totalItems} total items`}</Badge>
                            </InlineStack>
                            <InlineStack gap="200" blockAlign="center">
                                <Text variant="bodySm" tone="subdued">Grand Total</Text>
                                <Text variant="headingLg" fontWeight="bold">
                                    {currency} {grandTotal}
                                </Text>
                            </InlineStack>
                        </InlineStack>
                    </Card>
                )}

                {/* Product list */}
                <Card>
                    {products.length === 0 ? (
                        <EmptyState
                            heading="No products found"
                            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                            <p>This collection has no saved products.</p>
                        </EmptyState>
                    ) : (
                        <BlockStack gap="300">
                            {products.map((product, i) => (
                                <div key={product.id}>
                                    <ProductCard product={product} />
                                    {i < products.length - 1 && (
                                        <Box paddingBlockStart="300">
                                            <Divider />
                                        </Box>
                                    )}
                                </div>
                            ))}
                        </BlockStack>
                    )}
                </Card>
            </BlockStack>
        </Page>
    );
}