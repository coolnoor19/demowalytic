import React, { useState, useEffect } from "react";
import api from "../../lib/api";   // adjust path if needed
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";
import StepCard from "./StepCard";
import { 
  Plus, 
  Save, 
  Zap, 
  Users, 
  Settings,
  Play,
  Trash2,
  Clock,
  Calendar,
  ChevronRight,
  Key,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";

export default function DragFlowBuilder() {
  const [flowName, setFlowName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [recipients, setRecipients] = useState("");
  const [steps, setSteps] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const [sessionIdError, setSessionIdError] = useState("");
  const [availableSessions, setAvailableSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [flowSchedule, setFlowSchedule] = useState({
    startDate: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    endDate: "",
    repeat: "none"
  });

  const timezones = [
    "America/New_York",
    "America/Chicago", 
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Tokyo",
    "Australia/Sydney"
  ];

  const repeatOptions = [
    { value: "none", label: "No Repeat" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" }
  ];

  // Fetch connected sessions from backend
  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
const response = await api.get("/sessions");
      if (response.data.success) {
        setAvailableSessions(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setAvailableSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Load sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Validate Session ID format
  const validateSessionId = (id) => {
    if (!id.trim()) {
      return "Session ID is required";
    }
    if (id.length < 3) {
      return "Session ID must be at least 3 characters";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return "Session ID can only contain letters, numbers, hyphens, and underscores";
    }
    return "";
  };

  // Copy session ID to clipboard
  const copySessionId = async () => {
    if (sessionId) {
      await navigator.clipboard.writeText(sessionId);
      setCopiedSessionId(true);
      setTimeout(() => setCopiedSessionId(false), 2000);
    }
  };

  // Handle Session ID change with validation
  const handleSessionIdChange = (value) => {
    setSessionId(value);
    const error = validateSessionId(value);
    setSessionIdError(error);
  };

  // Handle session selection from dropdown
  const handleSessionSelect = (selectedSessionId) => {
    setSessionId(selectedSessionId);
    setSessionIdError("");
  };

  const calculateStepTiming = (steps) => {
    if (!flowSchedule.startDate) return steps;

    let currentDate = new Date(flowSchedule.startDate);
    if (flowSchedule.startTime) {
      const [hours, minutes] = flowSchedule.startTime.split(':');
      currentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    return steps.map(step => {
      const stepDate = new Date(currentDate);
      
      // Add delay days
      if (step.delayDays > 0) {
        stepDate.setDate(stepDate.getDate() + step.delayDays);
      }
      
      // Set specific date if provided
      if (step.sendDate) {
        const customDate = new Date(step.sendDate);
        stepDate.setFullYear(customDate.getFullYear(), customDate.getMonth(), customDate.getDate());
      }
      
      // Set specific time if provided
      if (step.sendTime) {
        const [hours, minutes] = step.sendTime.split(':');
        stepDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const formattedDate = stepDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      const formattedTime = stepDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const fullDate = stepDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Move current date for next step calculation
      if (step.delayDays > 0) {
        currentDate = new Date(stepDate);
      }
      
      return {
        ...step,
        calculatedDate: formattedDate,
        calculatedTime: formattedTime,
        fullDate: fullDate,
        fullDateTime: stepDate,
        timestamp: stepDate.getTime()
      };
    });
  };

  const addStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      sequence: steps.length + 1,
      message: "",
      delayDays: 0,
      sendDate: "",
      sendTime: "",
      repeatDaily: false,
      repeatTime: "",
      mediaUrl: "",
      type: "message",
    };
    
    setSteps([...steps, newStep]);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reordered = Array.from(steps);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updatedSteps = reordered.map((step, index) => ({
      ...step,
      sequence: index + 1
    }));

    setSteps(updatedSteps);
  };

  const updateStep = (id, updated) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteStep = (id) => {
    const filtered = steps.filter((s) => s.id !== id);
    const updatedSteps = filtered.map((s, i) => ({ ...s, sequence: i + 1 }));
    setSteps(updatedSteps);
  };

  const getFlowDuration = () => {
    if (steps.length === 0) return "0 days";
    
    const timedSteps = calculateStepTiming(steps);
    if (timedSteps.length < 2) return "Instant";
    
    const firstStep = timedSteps[0].timestamp;
    const lastStep = timedSteps[timedSteps.length - 1].timestamp;
    const durationMs = lastStep - firstStep;
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    return `${durationDays} day${durationDays !== 1 ? 's' : ''}`;
  };

  const getFlowStartDate = () => {
    if (!flowSchedule.startDate) return "Not set";
    
    const date = new Date(flowSchedule.startDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFlowEndDate = () => {
    const timedSteps = calculateStepTiming(steps);
    if (timedSteps.length === 0) return "Not set";
    
    const lastStep = timedSteps[timedSteps.length - 1];
    return lastStep.fullDate;
  };

  const saveFlow = async () => {
    // Validate Session ID before saving
    const sessionIdValidation = validateSessionId(sessionId);
    if (sessionIdValidation) {
      setSessionIdError(sessionIdValidation);
      return;
    }

    if (!flowName.trim()) {
      toast.error("Please enter a flow name");
      return;
    }

    if (steps.length === 0) {
      toast.error("Please add at least one step");
      return;
    }

    if (!flowSchedule.startDate) {
      toast.error("Please select a start date for the flow");
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.post("/flows", {
        name: flowName,
        sessionId: sessionId.trim(),
        recipients: recipients.split(",").map((r) => r.trim()).filter(r => r),
        schedule: flowSchedule,
        totalDuration: getFlowDuration(),
        startDate: getFlowStartDate(),
        endDate: getFlowEndDate()
      });

      const flowId = res.data.data._id;

      const stepsWithTiming = calculateStepTiming(steps);

     await api.post(`/flows/${flowId}/steps`, {
  steps: stepsWithTiming.map((s) => ({
    sequence: s.sequence,
    message: s.message,
    mediaUrl: s.mediaUrl,

    // ⭐ IMPORTANT SCHEDULING FIELDS
    scheduledDate: s.fullDateTime ? s.fullDateTime.toISOString() : null,
    sendDate: s.sendDate || null,
    sendTime: s.sendTime || null,

    // ⭐ disable old fields that cause immediate send
    sendAt: null,
    delayDays: 0,

    repeatDaily: s.repeatDaily,
    repeatTime: s.repeatTime,
    type: s.type,
  })),
});


      toast.success("🎉 Flow created successfully! Session ID: " + sessionId + " Save this Session ID to trigger your flow.");
      setFlowName("");
      setSessionId("");
      setRecipients("");
      setSteps([]);
      setFlowSchedule({
        startDate: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        endDate: "",
        repeat: "none"
      });
      setSessionIdError("");
    } catch (err) {
      console.error(err);
      toast.error("❌ Error saving flow");
    } finally {
      setIsSaving(false);
    }
  };

  const timedSteps = calculateStepTiming(steps);
  const isSessionIdValid = !sessionIdError && sessionId.trim();
  const connectedSessions = availableSessions.filter(s => s.status === 'connected');
  const selectedSession = availableSessions.find(s => s.sessionId === sessionId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flow Builder</h1>
              <p className="text-gray-600 text-sm">Design your automated message sequence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Flow Timeline Summary */}
            <div className="text-right hidden md:block">
              <div className="text-sm text-gray-600">Flow Timeline</div>
              <div className="font-semibold text-blue-600 flex items-center gap-1">
                <span className="text-xs">{getFlowStartDate()}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-xs">{getFlowEndDate()}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">Duration</div>
              <div className="font-semibold text-blue-600">{getFlowDuration()}</div>
            </div>
            
            <button
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg border border-gray-300 transition-colors"
              onClick={() => setSteps([])}
              disabled={steps.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
            
            <button
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={saveFlow}
              disabled={isSaving || steps.length === 0 || !isSessionIdValid}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Flow
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Settings Panel */}
          <div className="xl:col-span-1 space-y-4">
            {/* Session ID Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  Session ID *
                </h3>
                <button
                  onClick={fetchSessions}
                  disabled={isLoadingSessions}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Refresh sessions"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Connected Sessions Dropdown */}
                {connectedSessions.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Select Connected Session
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={sessionId}
                      onChange={(e) => handleSessionSelect(e.target.value)}
                    >
                      <option value="">Choose a connected session...</option>
                      {connectedSessions.map(session => (
                        <option key={session.sessionId} value={session.sessionId}>
                          {session.sessionId} {session.number && `(${session.number})`}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                      <Wifi className="w-3 h-3" />
                      {connectedSessions.length} session(s) connected
                    </div>
                  </div>
                )}

                {/* Manual Session ID Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {connectedSessions.length > 0 ? 'Or enter Session ID manually' : 'Enter Session ID'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        sessionIdError 
                          ? 'border-red-300 bg-red-50' 
                          : isSessionIdValid 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-300'
                      }`}
                      placeholder="e.g., welcome_flow_001, customer_support, etc."
                      value={sessionId}
                      onChange={(e) => handleSessionIdChange(e.target.value)}
                      required
                    />
                    <button
                      onClick={copySessionId}
                      disabled={!sessionId}
                      className="px-3 py-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Copy Session ID"
                    >
                      {copiedSessionId ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  {/* Validation Messages */}
                  {sessionIdError && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {sessionIdError}
                    </div>
                  )}
                  
                  {isSessionIdValid && (
                    <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                      <Check className="w-3 h-3" />
                      Session ID looks good
                      {selectedSession && selectedSession.status === 'connected' && (
                        <span className="flex items-center gap-1 ml-2">
                          <Wifi className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      Required field
                    </span>
                    <span className="text-xs text-gray-500">
                      {sessionId.length}/50 chars
                    </span>
                  </div>
                </div>
              </div>

              {/* No Connected Sessions Message */}
              {connectedSessions.length === 0 && !isLoadingSessions && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 text-xs">
                    <WifiOff className="w-4 h-4" />
                    <div>
                      <p className="font-medium">No connected sessions found</p>
                      <p>Connect a WhatsApp session first to see it here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Flow Schedule */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Flow Schedule
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={flowSchedule.startDate}
                    onChange={(e) => setFlowSchedule({...flowSchedule, startDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {getFlowStartDate()}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={flowSchedule.startTime}
                    onChange={(e) => setFlowSchedule({...flowSchedule, startTime: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={flowSchedule.timezone}
                    onChange={(e) => setFlowSchedule({...flowSchedule, timezone: e.target.value})}
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Repeat
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={flowSchedule.repeat}
                    onChange={(e) => setFlowSchedule({...flowSchedule, repeat: e.target.value})}
                  >
                    {repeatOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {flowSchedule.repeat !== "none" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={flowSchedule.endDate}
                      onChange={(e) => setFlowSchedule({...flowSchedule, endDate: e.target.value})}
                      min={flowSchedule.startDate}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Flow Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                Flow Settings
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Flow Name *
                  </label>
                  <input
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Welcome Sequence"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Recipients
                  </label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter WhatsApp numbers, separated by commas"
                    rows="2"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: 919876543210, 441234567890
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            {steps.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Flow Overview</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-blue-600">{steps.length}</div>
                    <div className="text-gray-600">Steps</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="font-semibold text-green-600">
                      {recipients.split(',').filter(r => r.trim()).length}
                    </div>
                    <div className="text-gray-600">Recipients</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-purple-600">{getFlowDuration()}</div>
                    <div className="text-gray-600">Duration</div>
                  </div>
                  <div className={`text-center p-2 rounded-lg ${
                    isSessionIdValid ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className={`font-semibold ${
                      isSessionIdValid ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isSessionIdValid ? '✓ Set' : '✗ Required'}
                    </div>
                    <div className="text-gray-600">Session ID</div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Step Button */}
            <button
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={addStep}
              disabled={!isSessionIdValid}
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>

          {/* Flow Builder Area */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              {steps.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                  <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">No steps yet</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {!isSessionIdValid ? "First, select or enter a valid Session ID" : "Start building your flow"}
                  </p>
                  <button
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={addStep}
                    disabled={!isSessionIdValid}
                  >
                    <Plus className="w-4 h-4" />
                    {!isSessionIdValid ? "Set Session ID First" : "Add First Step"}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  {/* Connection Lines */}
                  <div className="absolute top-10 left-8 bottom-10 w-0.5 bg-blue-200 ml-4 z-0" />
                  
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="steps">
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-3 relative z-10"
                        >
                          {timedSteps.map((step, index) => (
                            <Draggable
                              key={step.id}
                              draggableId={step.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`transform transition-all ${
                                    snapshot.isDragging ? 'scale-105 rotate-2 shadow-xl' : 'hover:scale-[1.02]'
                                  }`}
                                >
                                  <div className="flex items-start gap-4 group">
                                    {/* Step Number & Timing */}
                                    <div className="flex flex-col items-center pt-3 min-w-24">
                                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold z-10">
                                        {step.sequence}
                                      </div>
                                      {index < steps.length - 1 && (
                                        <div className="w-0.5 h-6 bg-blue-300 mt-2" />
                                      )}
                                      <div className="text-xs text-center mt-2 space-y-1">
                                        <div className="font-semibold text-gray-900 bg-blue-50 px-2 py-1 rounded">
                                          {step.calculatedDate}
                                        </div>
                                        <div className="text-gray-600 font-medium">
                                          {step.calculatedTime}
                                        </div>
                                        {step.delayDays > 0 && (
                                          <div className="text-orange-600 text-xs">
                                            +{step.delayDays}d
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Step Content */}
                                    <div
                                      className={`flex-1 bg-white rounded-lg border-2 transition-all ${
                                        snapshot.isDragging
                                          ? 'border-blue-500 shadow-xl'
                                          : 'border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300'
                                      }`}
                                    >
                                      <div className="p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                              Step {step.sequence}
                                            </span>
                                            {step.sendDate && (
                                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Custom Date
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div 
                                            {...provided.dragHandleProps}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-gray-400 hover:text-gray-600"
                                          >
                                            ⠿
                                          </div>
                                        </div>
                                        
                                        {/* Compact Step Card */}
                                        <div className="text-sm">
                                          <StepCard
                                            step={step}
                                            updateStep={updateStep}
                                            deleteStep={deleteStep}
                                            compact={true}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              )}

              {/* Add Step at Bottom */}
              {steps.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <button
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    onClick={addStep}
                  >
                    <Plus className="w-4 h-4" />
                    Add Next Step
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Session ID Usage Instructions */}
        {isSessionIdValid && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              How Session IDs Work
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Auto-fetch:</strong> Select from connected WhatsApp sessions above</p>
              <p>• <strong>Manual input:</strong> Enter any Session ID that exists in your system</p>
              <p>• Your flow will be triggered when you use this Session ID: <code className="bg-blue-100 px-2 py-1 rounded font-mono">{sessionId}</code></p>
              <p>• Make sure the WhatsApp session is connected and active for messages to send</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}