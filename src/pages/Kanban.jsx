import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Loader2, Phone, MessageSquare, Clock, Tag, ChevronUp, ChevronDown } from 'lucide-react';

const COLUMNS = [
    { id: 'new_lead', title: 'To Do', dot: 'bg-blue-500' },
    { id: 'contacted', title: 'Contacted', dot: 'bg-amber-500' },
    { id: 'qualified', title: 'In Progress', dot: 'bg-purple-500' },
    { id: 'won', title: 'Won', dot: 'bg-emerald-500' },
    { id: 'lost', title: 'Lost', dot: 'bg-rose-500' },
];

const STATUS_BADGE = {
    new_lead: { label: 'New', className: 'bg-blue-50 text-blue-600 border-blue-200' },
    contacted: { label: 'Contacted', className: 'bg-amber-50 text-amber-600 border-amber-200' },
    qualified: { label: 'Qualified', className: 'bg-purple-50 text-purple-600 border-purple-200' },
    won: { label: 'Won', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    lost: { label: 'Lost', className: 'bg-rose-50 text-rose-600 border-rose-200' },
};

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
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-text-secondary mt-4 font-medium">Loading your pipeline...</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-dark">Kanban Board</h1>
                <p className="text-text-secondary text-sm mt-1">Manage tasks with drag & drop boards</p>
            </div>

            {/* Session Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                    WhatsApp Session
                </label>
                <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full max-w-sm bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                    <option value="">Choose a session</option>
                    {sessions.map(s => (
                        <option key={s.sessionId} value={s.sessionId}>
                            {s.number} - {s.status}
                        </option>
                    ))}
                </select>
            </div>

            {/* Kanban Board */}
            {selectedSession ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {COLUMNS.map(column => {
                            const count = groupedContacts[column.id]?.length || 0;
                            return (
                                <div key={column.id} className="flex flex-col min-w-0">
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
                                            <h3 className="text-sm font-semibold text-text-dark">{column.title}</h3>
                                            <span className="text-xs text-text-muted bg-page-bg border border-border rounded-full px-2 py-0.5 font-medium">
                                                {count}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Column Body */}
                                    <Droppable droppableId={column.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 bg-page-bg rounded-xl border border-border p-2.5 min-h-[480px] transition-colors duration-200 ${
                                                    snapshot.isDraggingOver ? 'bg-primary-light border-primary/30' : ''
                                                }`}
                                            >
                                                <div className="space-y-2.5">
                                                    {groupedContacts[column.id]?.map((contact, index) => (
                                                        <Draggable
                                                            key={contact._id}
                                                            draggableId={contact._id}
                                                            index={index}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`bg-surface rounded-lg border border-border p-3.5 cursor-pointer transition-all duration-150 ${
                                                                        snapshot.isDragging
                                                                            ? 'shadow-lg ring-2 ring-primary/30 rotate-1'
                                                                            : 'hover:shadow-sm hover:border-border'
                                                                    }`}
                                                                    onClick={() => handleContactClick(contact)}
                                                                >
                                                                    {/* Card Top: Name + Status Badge */}
                                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                                <Phone className="h-3.5 w-3.5 text-primary" />
                                                                            </div>
                                                                            <span className="text-sm font-semibold text-text-dark truncate">
                                                                                {contact.name || 'Unknown'}
                                                                            </span>
                                                                        </div>
                                                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_BADGE[contact.status]?.className || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                                            {STATUS_BADGE[contact.status]?.label || contact.status}
                                                                        </span>
                                                                    </div>

                                                                    {/* Phone Number */}
                                                                    <p className="text-xs text-text-muted mb-2 pl-10 truncate">
                                                                        {contact.number}
                                                                    </p>

                                                                    {/* Last Message */}
                                                                    {contact.lastMessage && (
                                                                        <div className="flex items-start gap-2 mb-2 pl-10">
                                                                            <MessageSquare className="h-3 w-3 text-text-muted mt-0.5 flex-shrink-0" />
                                                                            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                                                                                {contact.lastMessage}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {/* Tags */}
                                                                    {contact.tags && contact.tags.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mb-2 pl-10">
                                                                            {contact.tags.map((tag, i) => (
                                                                                <span
                                                                                    key={i}
                                                                                    className="text-[10px] font-medium text-text-secondary bg-page-bg border border-border rounded px-1.5 py-0.5"
                                                                                >
                                                                                    {tag}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {/* Bottom Row: Time */}
                                                                    {contact.lastMessageTime && (
                                                                        <div className="flex items-center gap-1 text-[11px] text-text-muted pl-10 pt-1 border-t border-border mt-2">
                                                                            <Clock className="h-3 w-3" />
                                                                            <span>
                                                                                {new Date(contact.lastMessageTime).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                </div>
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            ) : (
                <div className="text-center py-16">
                    {sessions.length === 0 ? (
                        <div className="max-w-sm mx-auto bg-surface rounded-xl border border-border p-8">
                            <div className="text-5xl mb-5">📱</div>
                            <h3 className="text-lg font-bold text-text-dark mb-2">
                                No Sessions Connected
                            </h3>
                            <p className="text-text-secondary text-sm mb-5 leading-relaxed">
                                Connect your WhatsApp account to start managing leads with the Kanban board
                            </p>
                            <Button onClick={() => navigate('/dashboard/whatsapp')}>
                                Connect WhatsApp
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-surface rounded-xl border border-border p-10 max-w-sm mx-auto">
                            <div className="text-4xl mb-3">👆</div>
                            <p className="text-text-secondary">Select a session above to view your contacts</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}