// import { useEffect, useState } from 'react';
// import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
// import { useNavigate } from 'react-router-dom';
// import api from '../lib/api';
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
// import { Badge } from '../components/ui/badge';
// import { Button } from '../components/ui/button';
// import { Loader2, MessageSquare, Phone, Tag, Clock, Sparkles } from 'lucide-react';

// const COLUMNS = [
//     { id: 'new_lead', title: 'New Lead', color: 'bg-primary', bgLight: 'bg-blue-50', border: 'border-blue-200' },
//     { id: 'contacted', title: 'Contacted', color: 'bg-warning', bgLight: 'bg-amber-50', border: 'border-amber-200' },
//     { id: 'qualified', title: 'Qualified', color: 'bg-purple-500', bgLight: 'bg-purple-50', border: 'border-purple-200' },
//     { id: 'won', title: 'Won', color: 'bg-success', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
//     { id: 'lost', title: 'Lost', color: 'bg-danger', bgLight: 'bg-rose-50', border: 'border-rose-200' },
// ];

// export default function Kanban() {
//     const [contacts, setContacts] = useState([]);
//     const [sessions, setSessions] = useState([]);
//     const [selectedSession, setSelectedSession] = useState('');
//     const [loading, setLoading] = useState(true);
//     const navigate = useNavigate();

//     useEffect(() => {
//         const fetchSessions = async () => {
//             try {
//                 const res = await api.get('/sessions');
//                 const list = res.data?.data || [];
//                 setSessions(list);

//                 const connected = list.find(s => s.status === 'connected');
//                 if (connected && !selectedSession) {
//                     setSelectedSession(connected.sessionId);
//                 } else if (list.length === 0) {
//                     setLoading(false);
//                 }
//             } catch (err) {
//                 console.error('Error fetching sessions:', err);
//                 setLoading(false);
//             }
//         };
//         fetchSessions();
//     }, []);

//     useEffect(() => {
//         if (!selectedSession) return;

//         const fetchContacts = async () => {
//             setLoading(true);
//             try {
//                 const res = await api.get(`/contacts/${selectedSession}`);
//                 setContacts(res.data?.data || []);
//             } catch (err) {
//                 console.error('Error fetching contacts:', err);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchContacts();
//     }, [selectedSession]);

//     const handleDragEnd = async (result) => {
//         const { destination, source, draggableId } = result;

//         if (!destination) return;

//         if (
//             destination.droppableId === source.droppableId &&
//             destination.index === source.index
//         ) {
//             return;
//         }

//         const newStatus = destination.droppableId;
//         const contactId = draggableId;

//         setContacts(prev =>
//             prev.map(c => (c._id === contactId ? { ...c, status: newStatus } : c))
//         );

//         try {
//             await api.put(`/contacts/${contactId}`, { status: newStatus });
//         } catch (err) {
//             console.error('Error updating contact status:', err);
//             const res = await api.get(`/contacts/${selectedSession}`);
//             setContacts(res.data?.data || []);
//         }
//     };

//     const handleContactClick = (contact) => {
//         navigate(`/dashboard/messages?chat=${contact.number}`);
//     };

//     const groupedContacts = COLUMNS.reduce((acc, column) => {
//         acc[column.id] = contacts.filter(c => c.status === column.id);
//         return acc;
//     }, {});

//     if (loading && selectedSession) {
//         return (
//             <div className="flex flex-col items-center justify-center h-96">
//                 <Loader2 className="h-10 w-10 animate-spin text-primary" />
//                 <p className="text-text-secondary mt-4 font-medium">Loading your pipeline...</p>
//             </div>
//         );
//     }

//     return (
//         <div>
//             <div className="p-6 lg:p-8">
//                 {/* Header */}
//                 <div className="mb-8">
//                     <div className="flex items-center gap-3 mb-3">
//                         <div className="p-2 bg-primary rounded-xl">
//                             <Sparkles className="h-6 w-6 text-white" />
//                         </div>
//                         <div>
//                             <h1 className="text-3xl font-bold text-text-dark">
//                                 CRM Pipeline
//                             </h1>
//                             <p className="text-text-secondary mt-1">Visualize and manage your WhatsApp leads with ease</p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Session Selector */}
//                 <div className="mb-8">
//                     <label className="block text-sm font-semibold text-text-secondary mb-3">
//                         WhatsApp Session
//                     </label>
//                     <select
//                         value={selectedSession}
//                         onChange={(e) => setSelectedSession(e.target.value)}
//                         className="w-full max-w-md bg-surface border border-border rounded-xl px-4 py-3 text-text-dark focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors font-medium"
//                     >
//                         <option value="">Choose a session</option>
//                         {sessions.map(s => (
//                             <option key={s.sessionId} value={s.sessionId}>
//                                 {s.number} - {s.status}
//                             </option>
//                         ))}
//                     </select>
//                 </div>

//                 {/* Kanban Board */}
//                 {selectedSession ? (
//                     <DragDropContext onDragEnd={handleDragEnd}>
//                         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
//                             {COLUMNS.map(column => (
//                                 <div key={column.id} className="flex flex-col">
//                                     <div className={`${column.color} rounded-t-xl p-4`}>
//                                         <h3 className="font-bold text-white flex items-center justify-between text-sm uppercase tracking-wide">
//                                             <span>{column.title}</span>
//                                             <Badge className="bg-white/20 text-white border-white/30 font-bold">
//                                                 {groupedContacts[column.id]?.length || 0}
//                                             </Badge>
//                                         </h3>
//                                     </div>

//                                     <Droppable droppableId={column.id}>
//                                         {(provided, snapshot) => (
//                                             <div
//                                                 ref={provided.innerRef}
//                                                 {...provided.droppableProps}
//                                                 className={`flex-1 bg-surface border border-border border-t-0 rounded-b-xl p-3 min-h-[500px] transition-all duration-200 ${
//                                                     snapshot.isDraggingOver ? 'bg-primary-light border-primary' : ''
//                                                 }`}
//                                             >
//                                                 <div className="space-y-3">
//                                                     {groupedContacts[column.id]?.map((contact, index) => (
//                                                         <Draggable
//                                                             key={contact._id}
//                                                             draggableId={contact._id}
//                                                             index={index}
//                                                         >
//                                                             {(provided, snapshot) => (
//                                                                 <Card
//                                                                     ref={provided.innerRef}
//                                                                     {...provided.draggableProps}
//                                                                     {...provided.dragHandleProps}
//                                                                     className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
//                                                                         snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
//                                                                     }`}
//                                                                     onClick={() => handleContactClick(contact)}
//                                                                 >
//                                                                     <CardHeader className="p-4 pb-2">
//                                                                         <CardTitle className="text-base font-bold flex items-center gap-2 text-text-dark">
//                                                                             <div className="p-1.5 bg-primary rounded-lg">
//                                                                                 <Phone className="h-3.5 w-3.5 text-white" />
//                                                                             </div>
//                                                                             <span className="truncate">{contact.name || 'Unknown'}</span>
//                                                                         </CardTitle>
//                                                                     </CardHeader>
//                                                                     <CardContent className="p-4 pt-0 space-y-2">
//                                                                         <p className="text-xs font-medium text-text-muted truncate bg-page-bg px-2 py-1 rounded-md">
//                                                                             {contact.number}
//                                                                         </p>
//                                                                         {contact.lastMessage && (
//                                                                             <div className="flex items-start gap-2 bg-page-bg p-2 rounded-lg">
//                                                                                 <MessageSquare className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
//                                                                                 <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
//                                                                                     {contact.lastMessage}
//                                                                                 </p>
//                                                                             </div>
//                                                                         )}
//                                                                         {contact.lastMessageTime && (
//                                                                             <div className="flex items-center gap-1.5 text-xs text-text-muted">
//                                                                                 <Clock className="h-3.5 w-3.5" />
//                                                                                 <span className="font-medium">
//                                                                                     {new Date(contact.lastMessageTime).toLocaleDateString()}
//                                                                                 </span>
//                                                                             </div>
//                                                                         )}
//                                                                         {contact.tags && contact.tags.length > 0 && (
//                                                                             <div className="flex flex-wrap gap-1.5 pt-1">
//                                                                                 {contact.tags.map((tag, i) => (
//                                                                                     <Badge key={i} variant="primary" className="text-xs">
//                                                                                         <Tag className="h-2.5 w-2.5 mr-1" />
//                                                                                         {tag}
//                                                                                     </Badge>
//                                                                                 ))}
//                                                                             </div>
//                                                                         )}
//                                                                     </CardContent>
//                                                                 </Card>
//                                                             )}
//                                                         </Draggable>
//                                                     ))}
//                                                 </div>
//                                                 {provided.placeholder}
//                                             </div>
//                                         )}
//                                     </Droppable>
//                                 </div>
//                             ))}
//                         </div>
//                     </DragDropContext>
//                 ) : (
//                     <div className="text-center py-16">
//                         {sessions.length === 0 ? (
//                             <div className="max-w-md mx-auto bg-surface rounded-xl border border-border p-8">
//                                 <div className="text-6xl mb-6">📱</div>
//                                 <h3 className="text-2xl font-bold text-text-dark mb-3">
//                                     No Sessions Connected
//                                 </h3>
//                                 <p className="text-text-secondary mb-6 leading-relaxed">
//                                     Connect your WhatsApp account to start managing leads with our Kanban board
//                                 </p>
//                                 <Button
//                                     onClick={() => navigate('/dashboard/whatsapp')}
//                                 >
//                                     Connect WhatsApp
//                                 </Button>
//                             </div>
//                         ) : (
//                             <div className="bg-surface rounded-xl border border-border p-12 max-w-md mx-auto">
//                                 <div className="text-5xl mb-4">👆</div>
//                                 <p className="text-text-secondary text-lg">Select a session above to view your contacts</p>
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Loader2, MessageSquare, Phone, Tag, Clock, Sparkles } from 'lucide-react';

const COLUMNS = [
    { id: 'new_lead', title: 'New Lead', color: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'contacted', title: 'Contacted', color: 'from-amber-500 to-orange-500', bgLight: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'qualified', title: 'Qualified', color: 'from-purple-500 to-pink-500', bgLight: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'won', title: 'Won', color: 'from-emerald-500 to-green-600', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'lost', title: 'Lost', color: 'from-rose-500 to-red-500', bgLight: 'bg-rose-50', border: 'border-rose-200' },
];

export default function Kanban() {
    const [contacts, setContacts] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch sessions on mount
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await api.get('/sessions');
                const list = res.data?.data || [];
                setSessions(list);

                const connected = list.find(s => s.status === 'connected');
                if (connected && !selectedSession) {
                    setSelectedSession(connected.sessionId);
                } else if (list.length === 0) {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error fetching sessions:', err);
                setLoading(false);
            }
        };
        fetchSessions();
    }, []);

    // Fetch contacts when session changes
    useEffect(() => {
        if (!selectedSession) return;

        const fetchContacts = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/contacts/${selectedSession}`);
                setContacts(res.data?.data || []);
            } catch (err) {
                console.error('Error fetching contacts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, [selectedSession]);

    // Handle drag end
    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId;
        const contactId = draggableId;

        setContacts(prev =>
            prev.map(c => (c._id === contactId ? { ...c, status: newStatus } : c))
        );

        try {
            await api.put(`/contacts/${contactId}`, { status: newStatus });
        } catch (err) {
            console.error('Error updating contact status:', err);
            const res = await api.get(`/contacts/${selectedSession}`);
            setContacts(res.data?.data || []);
        }
    };

    // Open chat with contact
    const handleContactClick = (contact) => {
        navigate(`/dashboard/messages?chat=${contact.number}`);
    };

    // Group contacts by status
    const groupedContacts = COLUMNS.reduce((acc, column) => {
        acc[column.id] = contacts.filter(c => c.status === column.id);
        return acc;
    }, {});

    if (loading && selectedSession) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="relative">
                    <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 rounded-full"></div>
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 relative z-10" />
                </div>
                <p className="text-gray-700 mt-6 font-medium">Loading your pipeline...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="p-6 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 bg-clip-text text-transparent">
                                CRM Pipeline
                            </h1>
                            <p className="text-gray-600 mt-1">Visualize and manage your WhatsApp leads with ease</p>
                        </div>
                    </div>
                </div>

                {/* Session Selector */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        WhatsApp Session
                    </label>
                    <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="w-full max-w-md bg-white border-2 border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-medium"
                    >
                        <option value="">Choose a session</option>
                        {sessions.map(s => (
                            <option key={s.sessionId} value={s.sessionId}>
                                {s.number} • {s.status}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Kanban Board */}
                {selectedSession ? (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
                            {COLUMNS.map(column => (
                                <div key={column.id} className="flex flex-col">
                                    <div className={`bg-gradient-to-r ${column.color} rounded-t-2xl p-4 shadow-md`}>
                                        <h3 className="font-bold text-white flex items-center justify-between text-sm uppercase tracking-wide">
                                            <span>{column.title}</span>
                                            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm font-bold">
                                                {groupedContacts[column.id]?.length || 0}
                                            </Badge>
                                        </h3>
                                    </div>

                                    <Droppable droppableId={column.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 ${column.bgLight} ${column.border} border-2 border-t-0 rounded-b-2xl p-3 min-h-[500px] transition-all duration-200 ${
                                                    snapshot.isDraggingOver ? 'bg-gradient-to-b from-blue-100 to-blue-50 border-blue-400 shadow-lg' : ''
                                                }`}
                                            >
                                                <div className="space-y-3">
                                                    {groupedContacts[column.id]?.map((contact, index) => (
                                                        <Draggable
                                                            key={contact._id}
                                                            draggableId={contact._id}
                                                            index={index}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <Card
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 border-2 bg-white ${
                                                                        snapshot.isDragging ? 'shadow-2xl rotate-3 scale-105 ring-4 ring-blue-200' : 'hover:border-blue-300'
                                                                    }`}
                                                                    onClick={() => handleContactClick(contact)}
                                                                >
                                                                    <CardHeader className="p-4 pb-2">
                                                                        <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-800">
                                                                            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                                                                                <Phone className="h-3.5 w-3.5 text-white" />
                                                                            </div>
                                                                            <span className="truncate">{contact.name || 'Unknown'}</span>
                                                                        </CardTitle>
                                                                    </CardHeader>
                                                                    <CardContent className="p-4 pt-0 space-y-2">
                                                                        <p className="text-xs font-medium text-gray-500 truncate bg-gray-50 px-2 py-1 rounded-md">
                                                                            {contact.number}
                                                                        </p>
                                                                        {contact.lastMessage && (
                                                                            <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg">
                                                                                <MessageSquare className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                                                    {contact.lastMessage}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        {contact.lastMessageTime && (
                                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                                                <span className="font-medium">
                                                                                    {new Date(contact.lastMessageTime).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {contact.tags && contact.tags.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                                                {contact.tags.map((tag, i) => (
                                                                                    <Badge key={i} className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-sm">
                                                                                        <Tag className="h-2.5 w-2.5 mr-1" />
                                                                                        {tag}
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </CardContent>
                                                                </Card>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                </div>
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            ))}
                        </div>
                    </DragDropContext>
                ) : (
                    <div className="text-center py-16">
                        {sessions.length === 0 ? (
                            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
                                <div className="mb-6 relative">
                                    <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 rounded-full"></div>
                                    <div className="text-7xl relative z-10">📱</div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                    No Sessions Connected
                                </h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Connect your WhatsApp account to start managing leads with our beautiful Kanban board
                                </p>
                                <Button 
                                    onClick={() => navigate('/dashboard/whatsapp')}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    Connect WhatsApp
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto border-2 border-gray-100">
                                <div className="text-6xl mb-4">👆</div>
                                <p className="text-gray-600 text-lg">Select a session above to view your contacts</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}