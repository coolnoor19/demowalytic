// import React, { useEffect, useState } from "react";
// import api from "../../lib/api";
// import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
// import { Loader2 } from "lucide-react";

// export default function AdminUserSubscriptionManager() {
//   const [subscriptions, setSubscriptions] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchSubs();
//   }, []);

//   const fetchSubs = async () => {
//     try {
//       const res = await api.get("/admin/subscriptions");
//       setSubscriptions(res.data || []);
//     } catch (err) {
//       console.error("Error fetching subscriptions", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Card className="shadow-sm border rounded-xl">
//       <CardHeader>
//         <CardTitle>User Subscriptions</CardTitle>
//       </CardHeader>
//       <CardContent>
//         {loading ? (
//           <div className="flex items-center justify-center py-6">
//             <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="border-b text-gray-700">
//                   <th className="p-3">User</th>
//                   <th className="p-3">Plan</th>
//                   <th className="p-3">Status</th>
//                   <th className="p-3">Renewal</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {subscriptions.map((sub) => (
//                   <tr key={sub._id} className="border-b hover:bg-gray-50">
//                     <td className="p-3">{sub.userEmail}</td>
//                     <td className="p-3">{sub.planName}</td>
//                     <td className="p-3">{sub.status}</td>
//                     <td className="p-3">{sub.renewalDate}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
