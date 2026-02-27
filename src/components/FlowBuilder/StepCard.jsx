import React from "react";
import { Trash2, Clock, MessageCircle, Image, Repeat, Calendar } from "lucide-react";

export default function StepCard({ step, updateStep, deleteStep, compact = false }) {
  const timeSuggestions = [
    "09:00", "12:00", "15:00", "18:00", "20:00"
  ];

  const delayOptions = [
    { value: 0, label: "Immediate" },
    { value: 1, label: "1 day later" },
    { value: 2, label: "2 days later" },
    { value: 3, label: "3 days later" },
    { value: 7, label: "1 week later" },
    { value: 14, label: "2 weeks later" },
    { value: 30, label: "1 month later" }
  ];

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Message Input */}
        <div>
          <textarea
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your message..."
            rows="2"
            value={step.message}
            onChange={(e) => updateStep(step.id, { message: e.target.value })}
          />
        </div>

        {/* Date & Time Controls */}
        <div className="space-y-2">
          {/* Delay Setting */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Schedule Timing
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                value={step.delayDays}
                onChange={(e) => updateStep(step.id, { delayDays: parseInt(e.target.value) })}
              >
                {delayOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <input
                type="time"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                value={step.sendTime}
                onChange={(e) => updateStep(step.id, { sendTime: e.target.value })}
                placeholder="HH:MM"
              />
            </div>
          </div>

          {/* Custom Date Option */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={!!step.sendDate}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateStep(step.id, { 
                      sendDate: new Date().toISOString().split('T')[0],
                      delayDays: 0 
                    });
                  } else {
                    updateStep(step.id, { sendDate: "" });
                  }
                }}
                className="rounded"
              />
              <Calendar className="w-3 h-3" />
              Specific Date
            </label>
            
            {step.sendDate && (
              <input
                type="date"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                value={step.sendDate}
                onChange={(e) => updateStep(step.id, { sendDate: e.target.value })}
                min={getMinDate()}
              />
            )}
          </div>

          {/* Quick Time Suggestions */}
          {!step.sendTime && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-gray-500 mr-1">Quick times:</span>
              {timeSuggestions.map(time => (
                <button
                  key={time}
                  type="button"
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                  onClick={() => updateStep(step.id, { sendTime: time })}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Additional Options */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center gap-3">
            {/* Media URL */}
            <div className="flex items-center gap-1">
              <Image className="w-3 h-3 text-gray-500" />
              <input
                type="text"
                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="Media URL"
                value={step.mediaUrl}
                onChange={(e) => updateStep(step.id, { mediaUrl: e.target.value })}
              />
            </div>

            {/* Repeat Option */}
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={step.repeatDaily}
                onChange={(e) => updateStep(step.id, { repeatDaily: e.target.checked })}
                className="rounded"
              />
              <Repeat className="w-3 h-3" />
              Repeat
            </label>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => deleteStep(step.id)}
            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete step"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Repeat Time if enabled */}
        {step.repeatDaily && (
          <div className="flex items-center gap-2 bg-blue-50 p-2 rounded text-xs">
            <span className="text-gray-600">Repeat daily at:</span>
            <input
              type="time"
              className="px-2 py-1 text-xs border border-gray-300 rounded"
              value={step.repeatTime}
              onChange={(e) => updateStep(step.id, { repeatTime: e.target.value })}
            />
          </div>
        )}
      </div>
    );
  }

  // Original full version as fallback
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Message</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows="3"
          value={step.message}
          onChange={(e) => updateStep(step.id, { message: e.target.value })}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Delay (Days)</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={step.delayDays}
            onChange={(e) => updateStep(step.id, { delayDays: parseInt(e.target.value) || 0 })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Send Time</label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={step.sendTime}
            onChange={(e) => updateStep(step.id, { sendTime: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Specific Date (Optional)</label>
        <input
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={step.sendDate}
          onChange={(e) => updateStep(step.id, { sendDate: e.target.value })}
          min={getMinDate()}
        />
      </div>
      
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={step.repeatDaily}
            onChange={(e) => updateStep(step.id, { repeatDaily: e.target.checked })}
          />
          Repeat Daily
        </label>
        
        {step.repeatDaily && (
          <input
            type="time"
            className="px-3 py-2 border border-gray-300 rounded-lg"
            value={step.repeatTime}
            onChange={(e) => updateStep(step.id, { repeatTime: e.target.value })}
          />
        )}
      </div>
      
      <button
        onClick={() => deleteStep(step.id)}
        className="flex items-center gap-2 text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4" />
        Delete Step
      </button>
    </div>
  );
}