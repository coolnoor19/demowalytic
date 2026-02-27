// import React, { useEffect, useState } from "react";
// import api from "../../lib/api";
// import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
// import { Button } from "../ui/button";
// import { Loader2 } from "lucide-react";

// export default function AdminUserSubscriptionManager() {
//   const [users, setUsers] = useState([]);
//   const [plans, setPlans] = useState([]);
//   const [subscriptions, setSubscriptions] = useState({});
//   const [loading, setLoading] = useState(true);

//   const [assignUserId, setAssignUserId] = useState("");
//   const [assignPlanId, setAssignPlanId] = useState("");

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);

//       // Fetch users and plans
//       const [usersRes, plansRes] = await Promise.all([
//         api.get("/admin/users"),
//         api.get("/admin/plans"),
//       ]);

//       const usersData = usersRes.data?.data || [];
//       const plansData = plansRes.data?.data || [];

//       setUsers(usersData);
//       setPlans(plansData);

//       // Fetch subscriptions for each user
//       const subPromises = usersData.map(u => api.get(`/admin/users/${u._id}/subscription`));
//       const subResults = await Promise.all(subPromises);

//       const subMap = {};
//       subResults.forEach((r, idx) => {
//         subMap[usersData[idx]._id] = r.data?.data || null;
//       });
//       setSubscriptions(subMap);

//     } catch (err) {
//       console.error("Error fetching data:", err);
//       alert("Failed to fetch users or plans");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAssignPlan = async () => {
//     if (!assignUserId || !assignPlanId) return alert("Select user and plan");

//     try {
//       await api.post(`/admin/users/${assignUserId}/assign-plan`, { planId: assignPlanId });
//       alert("Plan assigned successfully");

//       // Refresh subscription for this user
//       const res = await api.get(`/admin/users/${assignUserId}/subscription`);
//       setSubscriptions(prev => ({ ...prev, [assignUserId]: res.data?.data }));

//       // Reset selection
//       setAssignUserId("");
//       setAssignPlanId("");
//     } catch (err) {
//       console.error(err);
//       alert("Failed to assign plan");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center p-8">
//         <Loader2 className="w-6 h-6 animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">

//       {/* USER SUBSCRIPTIONS */}
//       <Card>
//         <CardHeader><CardTitle>User Subscriptions</CardTitle></CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="border-b text-gray-700">
//                   <th className="p-3">User</th>
//                   <th className="p-3">Email</th>
//                   <th className="p-3">Plan</th>
//                   <th className="p-3">Status</th>
//                   <th className="p-3">Renewal</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {users.map(u => {
//                   const sub = subscriptions[u._id];
//                   return (
//                     <tr key={u._id} className="border-b hover:bg-gray-50">
//                       <td className="p-3">{u.name}</td>
//                       <td className="p-3">{u.email}</td>
//                       <td className="p-3">{sub?.planName || "-"}</td>
//                       <td className="p-3">{sub?.status || "-"}</td>
//                       <td className="p-3">{sub?.renewalDate || "-"}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* ASSIGN PLAN */}
//       <Card>
//         <CardHeader><CardTitle>Assign Plan to User</CardTitle></CardHeader>
//         <CardContent className="flex flex-wrap gap-4 items-center">
//           <select
//             className="border p-2 rounded"
//             value={assignUserId}
//             onChange={e => setAssignUserId(e.target.value)}
//           >
//             <option value="">Select User</option>
//             {users.map(u => (
//               <option key={u._id} value={u._id}>{u.name}</option>
//             ))}
//           </select>

//           <select
//             className="border p-2 rounded"
//             value={assignPlanId}
//             onChange={e => setAssignPlanId(e.target.value)}
//           >
//             <option value="">Select Plan</option>
//             {plans.filter(p => p.is_active).map(p => (
//               <option key={p._id} value={p._id}>{p.name} (${p.price})</option>
//             ))}
//           </select>

//           <Button onClick={handleAssignPlan}>Assign Plan</Button>
//         </CardContent>
//       </Card>

//     </div>
//   );
// }  