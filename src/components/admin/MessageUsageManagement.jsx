// import React, { useEffect, useState } from "react";
// import api from "../../lib/api";
// import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
// import { Loader2 } from "lucide-react";

// export default function MessageUsageManagement() {
//   const [usage, setUsage] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchUsage();
//   }, []);

//   const fetchUsage = async () => {
//     try {
//       // ✅ You can later replace this with real usage route
//       const res = await api.get("/admin/users");
//       const users = Array.isArray(res.data?.data) ? res.data.data : [];
//       setUsage(users.map((u) => ({ _id: u._id, userEmail: u.email, count: 0 })));
//     } catch (err) {
//       console.error("Error fetching usage", err);
//       setUsage([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Card className="shadow-sm border rounded-xl">
//       <CardHeader>
//         <CardTitle>Message Usage</CardTitle>
//       </CardHeader>
//       <CardContent>
//         {loading ? (
//           <div className="flex items-center justify-center py-6">
//             <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
//           </div>
//         ) : (
//           <ul className="space-y-2">
//             {usage.map((u) => (
//               <li key={u._id} className="flex justify-between text-sm">
//                 <span>{u.userEmail}</span>
//                 <span>{u.count} messages</span>
//               </li>
//             ))}
//           </ul>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
