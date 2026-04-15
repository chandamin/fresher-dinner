import { json } from "@remix-run/node";
import { useLoaderData } from "react-router";
import db from "../db.server";

export const loader = async ({ request }) => {

  
  // Prisma se saare customers fetch karo
  const customers = await db.customer.findMany({
    include: {
      wallet: true,
      orders: true,
      savedCollections: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return json({ customers });
};

export default function CustomersPage() {
  const { customers } = useLoaderData();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Customers</h1>
      
      {customers.length === 0 ? (
        <p>No customer found</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>ID</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Shopify Customer ID</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Email</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Created At</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Orders</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Collections</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {customer.id.slice(0, 20)}...
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {customer.shopifyCustomerId}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {customer.email || "N/A"}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {new Date(customer.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {customer.orders?.length || 0}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
               
                    {customer.savedCollections?.length ? (
                      customer.savedCollections.map((col) => (
                        <div key={col.id}>
                          <a href={`/collection/${col.collectionId}`}>
                            {col.collectionId}
                          </a>
                        </div>
                      ))
                    ) : (
                      "No Collections"
                    )}
                 
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}



// export async function loader() {
//   const customers = await db.customer.findMany({
//     orderBy: { createdAt: "desc" },
//   });

//   return json({ customers });
// }

// export default function Index() {
//   const data = useLoaderData();
//   const customers = data.customers || [];

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>Customers</h1>

//       {customers.length === 0 ? (
//         <p>No customers found</p>
//       ) : (
//         <table border="1" cellPadding="10">
//           <thead>
//             <tr>
//               <th>ID</th>
//               <th>Shopify Customer ID</th>
//               <th>Email</th>
//               <th>Created</th>
//             </tr>
//           </thead>

//           <tbody>
//             {customers.map((c) => (
//               <tr key={c.id}>
//                 <td>{c.id}</td>
//                 <td>{c.shopifyCustomerId}</td>
//                 <td>{c.email || "N/A"}</td>
//                 <td>{new Date(c.createdAt).toLocaleDateString()}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }