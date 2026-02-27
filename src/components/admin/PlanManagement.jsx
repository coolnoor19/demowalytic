// import React, { useEffect, useState } from "react";
// import api from "../../lib/api";
// import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { Loader2 } from "lucide-react";
// import { Switch } from "../ui/switch";

// export default function AdminDashboard() {
//   const [loading, setLoading] = useState(true);

//   // --- Features ---
//   const [features, setFeatures] = useState([]);
//   const [featureName, setFeatureName] = useState("");
//   const [featureType, setFeatureType] = useState("boolean");
//   const [editingFeatureId, setEditingFeatureId] = useState(null);

//   // --- Plans ---
//   const [plans, setPlans] = useState([]);
//   const [planName, setPlanName] = useState("");
//   const [planPrice, setPlanPrice] = useState("");
//   const [planLimit, setPlanLimit] = useState("");
//   const [planFeatures, setPlanFeatures] = useState([]);
//   const [planActive, setPlanActive] = useState(true);
//   const [editingPlanId, setEditingPlanId] = useState(null);

//   // --- Users & Subscriptions ---
//   const [users, setUsers] = useState([]);
//   const [subscriptions, setSubscriptions] = useState({});
//   const [assignUserId, setAssignUserId] = useState("");
//   const [assignPlanId, setAssignPlanId] = useState("");

//   // --- Fetch all data ---
//   useEffect(() => {
//     fetchAllData();
//   }, []);

//   const fetchAllData = async () => {
//     try {
//       setLoading(true);

//       const [featuresRes, plansRes, usersRes] = await Promise.all([
//         api.get("/admin/features"),
//         api.get("/admin/plans"),
//         api.get("/admin/users"),
//       ]);

//       const fetchedFeatures = featuresRes.data?.data || [];
//       const fetchedPlans = plansRes.data?.data || [];
//       const fetchedUsers = usersRes.data?.data || [];

//       setFeatures(fetchedFeatures);
//       setPlans(fetchedPlans);
//       setUsers(fetchedUsers);

//       // Fetch subscriptions for all users
//       const subPromises = fetchedUsers.map(u =>
//         api.get(`/admin/users/${u._id}/subscription`)
//       );
//       const subResults = await Promise.all(subPromises);

//       const subMap = {};
//       subResults.forEach((res, idx) => {
//         subMap[fetchedUsers[idx]._id] = res.data?.data || null;
//       });
//       setSubscriptions(subMap);

//     } catch (err) {
//       console.error("Error fetching data:", err);
//       alert("Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------- FEATURE HANDLERS ----------------
//   const handleFeatureSave = async () => {
//     if (!featureName) return alert("Feature name required");

//     try {
//       if (editingFeatureId) {
//         await api.put(`/admin/features/${editingFeatureId}`, { name: featureName, type: featureType });
//       } else {
//         await api.post("/admin/features", { name: featureName, type: featureType });
//       }
//       setFeatureName("");
//       setFeatureType("boolean");
//       setEditingFeatureId(null);
//       fetchAllData();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to save feature");
//     }
//   };

//   const handleFeatureEdit = (f) => {
//     setFeatureName(f.name);
//     setFeatureType(f.type);
//     setEditingFeatureId(f._id);
//   };

//   const handleFeatureDelete = async (id) => {
//     if (!window.confirm("Delete this feature?")) return;
//     try {
//       await api.delete(`/admin/features/${id}`);
//       fetchAllData();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to delete feature");
//     }
//   };

//   // ---------------- PLAN HANDLERS ----------------
//   const handlePlanSave = async () => {
//     if (!planName || !planPrice) return alert("Plan name & price required");

//     const payload = {
//       name: planName,
//       price: parseFloat(planPrice),
//       message_limit: parseInt(planLimit) || 0,
//       features: planFeatures,
//       is_active: planActive,
//     };

//     try {
//       if (editingPlanId) {
//         await api.put(`/admin/plans/${editingPlanId}`, payload);
//       } else {
//         await api.post("/admin/plans", payload);
//       }
//       resetPlanForm();
//       fetchAllData();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to save plan");
//     }
//   };

//   const handlePlanEdit = (p) => {
//     setPlanName(p.name);
//     setPlanPrice(p.price);
//     setPlanLimit(p.message_limit);
//     setPlanFeatures(p.features?.map(f => typeof f === "object" ? f._id : f) || []);
//     setPlanActive(p.is_active);
//     setEditingPlanId(p._id);
//   };

//   const handlePlanDelete = async (id) => {
//     if (!window.confirm("Delete this plan?")) return;
//     try {
//       await api.delete(`/admin/plans/${id}`);
//       fetchAllData();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to delete plan");
//     }
//   };

//   const resetPlanForm = () => {
//     setPlanName("");
//     setPlanPrice("");
//     setPlanLimit("");
//     setPlanFeatures([]);
//     setPlanActive(true);
//     setEditingPlanId(null);
//   };

//   // ---------------- ASSIGN PLAN ----------------
//   const handleAssignPlan = async () => {
//     if (!assignUserId || !assignPlanId) return alert("Select user & plan");

//     try {
//       await api.post(`/admin/users/${assignUserId}/assign-plan`, { planId: assignPlanId });
//       alert("Plan assigned successfully");

//       // Refresh user's subscription
//       const res = await api.get(`/admin/users/${assignUserId}/subscription`);
//       setSubscriptions(prev => ({ ...prev, [assignUserId]: res.data?.data }));

//       setAssignUserId("");
//       setAssignPlanId("");
//     } catch (err) {
//       console.error(err);
//       alert("Failed to assign plan");
//     }
//   };

//   if (loading) return (
//     <div className="flex justify-center items-center p-8">
//       <Loader2 className="w-6 h-6 animate-spin" />
//     </div>
//   );

//   return (
//     <div className="space-y-8">

//       {/* FEATURE MANAGEMENT */}
//       <Card>
//         <CardHeader><CardTitle>Feature Management</CardTitle></CardHeader>
//         <CardContent>
//           <div className="flex gap-2 mb-4 flex-wrap">
//             <Input placeholder="Feature Name" value={featureName} onChange={e => setFeatureName(e.target.value)} />
//             <select value={featureType} onChange={e => setFeatureType(e.target.value)} className="border px-2 rounded">
//               <option value="boolean">Boolean</option>
//               <option value="value">Value</option>
//             </select>
//             <Button onClick={handleFeatureSave}>{editingFeatureId ? "Update" : "Create"}</Button>
//           </div>
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="border-b">
//                 <th className="p-2">Name</th>
//                 <th className="p-2">Type</th>
//                 <th className="p-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {features.map(f => (
//                 <tr key={f._id} className="border-b hover:bg-gray-50">
//                   <td className="p-2">{f.key}</td>
//                   <td className="p-2">{f.type}</td>
//                   <td className="p-2 flex gap-2">
//                     <Button size="sm" onClick={() => handleFeatureEdit(f)}>Edit</Button>
//                     <Button size="sm" variant="destructive" onClick={() => handleFeatureDelete(f._id)}>Delete</Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </CardContent>
//       </Card>

//       {/* PLAN MANAGEMENT */}
//       <Card>
//         <CardHeader><CardTitle>Plan Management</CardTitle></CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
//             <Input placeholder="Plan Name" value={planName} onChange={e => setPlanName(e.target.value)} />
//             <Input type="number" placeholder="Price" value={planPrice} onChange={e => setPlanPrice(e.target.value)} />
//             <Input type="number" placeholder="Message Limit" value={planLimit} onChange={e => setPlanLimit(e.target.value)} />
//             <div className="flex flex-wrap gap-1 col-span-2">
//               {features.map(f => (
//                 <label key={f._id} className={`px-2 py-1 border rounded cursor-pointer ${planFeatures.includes(f._id) ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
//                   <input type="checkbox" className="hidden" checked={planFeatures.includes(f._id)} onChange={() => {
//                     setPlanFeatures(prev => prev.includes(f._id) ? prev.filter(id => id !== f._id) : [...prev, f._id]);
//                   }} />
//                   {f.name}
//                 </label>
//               ))}
//             </div>
//             <div className="flex items-center gap-2">
//               <Switch checked={planActive} onCheckedChange={setPlanActive} />
//               Active
//             </div>
//             <Button onClick={handlePlanSave}>{editingPlanId ? "Update" : "Create"}</Button>
//           </div>
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="border-b">
//                 <th className="p-2">Name</th>
//                 <th className="p-2">Price</th>
//                 <th className="p-2">Limit</th>
//                 <th className="p-2">Features</th>
//                 <th className="p-2">Active</th>
//                 <th className="p-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {plans.map(p => (
//                 <tr key={p._id} className="border-b hover:bg-gray-50">
//                   <td className="p-2">{p.name}</td>
//                   <td className="p-2">${p.price}</td>
//                   <td className="p-2">{p.message_limit}</td>
//                   <td className="p-2">{p.features?.map(fId => features.find(f => f._id === fId)?.name || fId).join(", ")}</td>
//                   <td className="p-2">{p.is_active ? "Yes" : "No"}</td>
//                   <td className="p-2 flex gap-2">
//                     <Button size="sm" onClick={() => handlePlanEdit(p)}>Edit</Button>
//                     <Button size="sm" variant="destructive" onClick={() => handlePlanDelete(p._id)}>Delete</Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </CardContent>
//       </Card>

//       {/* ASSIGN PLAN TO USER */}
//       <Card>
//         <CardHeader><CardTitle>Assign Plan to User</CardTitle></CardHeader>
//         <CardContent className="flex gap-2 flex-wrap items-center">
//           <select className="border p-2 rounded" value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
//             <option value="">Select User</option>
//             {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
//           </select>
//           <select className="border p-2 rounded" value={assignPlanId} onChange={e => setAssignPlanId(e.target.value)}>
//             <option value="">Select Plan</option>
//             {plans.map(p => <option key={p._id} value={p._id}>{p.name} (${p.price})</option>)}
//           </select>
//           <Button onClick={handleAssignPlan}>Assign Plan</Button>
//         </CardContent>
//       </Card>

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

//     </div>
//   );
// }
