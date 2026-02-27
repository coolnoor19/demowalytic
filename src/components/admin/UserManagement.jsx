// import React, { useEffect, useState } from "react";
// import api from "../../lib/api";
// import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
// import { Button } from "../ui/button";
// import { Loader2, Trash2 } from "lucide-react";

// export default function UserManagement() {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     try {
//       const res = await api.get("/admin/users");
//       const data = Array.isArray(res.data?.data) ? res.data.data : [];
//       setUsers(data);
//     } catch (err) {
//       console.error("Error fetching users", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this user?")) return;
//     try {
//       await api.delete(`/admin/users/${id}`);
//       setUsers((prev) => prev.filter((u) => u._id !== id));
//     } catch (err) {
//       console.error("Error deleting user", err);
//     }
//   };

//   return (
//     <Card className="shadow-sm border rounded-xl">
//       <CardHeader>
//         <CardTitle>User Management</CardTitle>
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
//                   <th className="p-3">Name</th>
//                   <th className="p-3">Email</th>
//                   <th className="p-3">Role</th>
//                   <th className="p-3">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {users.map((user) => (
//                   <tr key={user._id} className="border-b hover:bg-gray-50">
//                     <td className="p-3">{user.name}</td>
//                     <td className="p-3">{user.email}</td>
//                     <td className="p-3">{user.role}</td>
//                     <td className="p-3">
//                       <Button
//                         variant="destructive"
//                         size="sm"
//                         onClick={() => handleDelete(user._id)}
//                         className="flex items-center gap-1"
//                       >
//                         <Trash2 className="h-4 w-4" />
//                         Delete
//                       </Button>
//                     </td>
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
