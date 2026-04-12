'use client';

import { useState, useEffect } from 'react';
import { Clock, Check, X, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface AvailabilityGridProps {
  initialData?: any;
  onSave: (data: any) => void;
  saving?: boolean;
}

export default function AvailabilityGrid({ initialData, onSave, saving }: AvailabilityGridProps) {
  const [schedule, setSchedule] = useState<Record<string, number[]>>(
    initialData || {
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
    }
  );

  const toggleSlot = (day: string, hour: number) => {
    setSchedule(prev => {
      const daySlots = prev[day] || [];
      const newSlots = daySlots.includes(hour)
        ? daySlots.filter(h => h !== hour)
        : [...daySlots, hour].sort((a, b) => a - b);
      return { ...prev, [day]: newSlots };
    });
  };

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}${period}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Recurring Availability
          </h3>
          <p className="text-xs text-gray-500 font-medium">Select the hours you are generally available for mentorship sessions.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-indigo-500" />
              <span className="text-[10px] text-gray-400 font-bold uppercase">Available</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-white/5 border border-white/10" />
              <span className="text-[10px] text-gray-400 font-bold uppercase">Busy</span>
           </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-2">
            <div />
            {DAYS.map(day => (
              <div key={day} className="text-center">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          <div className="space-y-1">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 items-center">
                <div className="text-[10px] text-right pr-3 font-bold text-gray-500">
                  {formatHour(hour)}
                </div>
                {DAYS.map(day => {
                  const isActive = schedule[day]?.includes(hour);
                  return (
                    <button
                      key={`${day}-${hour}`}
                      type="button"
                      onClick={() => toggleSlot(day, hour)}
                      className={`h-8 rounded-md transition-all border ${
                        isActive 
                          ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                          : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
         <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-400" />
            <p className="text-xs text-indigo-300 font-medium max-w-md">
               Changes will affect your public calendar. Mentors with consistent slots typically get 3x more bookings.
            </p>
         </div>
         <button
           type="button"
           onClick={() => onSave(schedule)}
           disabled={saving}
           className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
         >
           {saving ? 'Saving...' : 'Update Schedule'}
         </button>
      </div>
    </div>
  );
}
