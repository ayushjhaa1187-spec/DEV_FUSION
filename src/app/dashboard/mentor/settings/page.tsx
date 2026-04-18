"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, Link as LinkIcon, DollarSign, Calendar, Clock } from 'lucide-react';

export default function MentorSettingsPage() {
    const [fee, setFee] = useState<number>(0);
    const [link, setLink] = useState('');
    const [rules, setRules] = useState<any[]>([]);
  
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const addRule = () => {
        setRules([...rules, { day_of_week: 1, start_time: "09:00", end_time: "17:00" }]);
    };

    const removeRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const updateRule = (index: number, key: string, value: string | number) => {
        const newRules = [...rules];
        newRules[index][key] = value;
        setRules(newRules);
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/mentors/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_fee: fee,
                    default_meeting_link: link,
                    availability_rules: rules
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Settings saved successfully!');
            } else {
                alert(data.error || 'Failed to save');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <header className="mb-8 border-b border-white/10 pb-6">
                <h1 className="text-4xl font-black text-rose-500 flex items-center gap-3">
                    <Settings /> Mentor Settings
                </h1>
                <p className="text-gray-400 mt-2">Configure your monetization and availability schedule.</p>
            </header>

            <div className="space-y-8">
                {/* General Settings */}
                <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                    <h2 className="text-2xl font-bold text-white mb-6">General</h2>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                <DollarSign size={16} /> Session Fee (₹)
                            </label>
                            <input 
                                type="number" 
                                min="0" max="500"
                                value={fee}
                                onChange={e => setFee(Number(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-rose-500 outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">Set between ₹0 (Free) and ₹500.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                <LinkIcon size={16} /> Default Meeting Link
                            </label>
                            <input 
                                type="url" 
                                value={link}
                                onChange={e => setLink(e.target.value)}
                                placeholder="https://meet.google.com/xyz"
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-rose-500 outline-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Schedule Builder */}
                <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Calendar className="text-rose-500" /> Availability Rules
                        </h2>
                        <button onClick={addRule} className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 px-4 py-2 rounded-lg font-bold transition-all text-sm">
                            + Add Rule
                        </button>
                    </div>

                    <div className="space-y-4">
                        {rules.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No availability rules set. You will not receive any bookings.</p>
                        )}
                        {rules.map((rule, idx) => (
                            <div key={idx} className="flex flex-wrap md:flex-nowrap gap-4 items-center bg-black/40 p-4 rounded-xl border border-white/5">
                                <select 
                                    className="bg-zinc-900 border border-white/10 text-white rounded-lg p-3 outline-none flex-1"
                                    value={rule.day_of_week}
                                    onChange={e => updateRule(idx, 'day_of_week', Number(e.target.value))}
                                >
                                    {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                </select>
                                
                                <div className="flex items-center gap-2 flex-1">
                                    <Clock size={16} className="text-gray-500" />
                                    <input 
                                        type="time" 
                                        value={rule.start_time}
                                        onChange={e => updateRule(idx, 'start_time', e.target.value)}
                                        className="bg-zinc-900 border border-white/10 text-white rounded-lg p-3 outline-none w-full"
                                    />
                                </div>
                                <span className="text-gray-500 font-bold">to</span>
                                <div className="flex items-center gap-2 flex-1">
                                    <Clock size={16} className="text-gray-500" />
                                    <input 
                                        type="time" 
                                        value={rule.end_time}
                                        onChange={e => updateRule(idx, 'end_time', e.target.value)}
                                        className="bg-zinc-900 border border-white/10 text-white rounded-lg p-3 outline-none w-full"
                                    />
                                </div>
                                
                                <button onClick={() => removeRule(idx)} className="text-red-500 hover:text-red-400 p-2 font-bold px-4">
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
                
                <button 
                    onClick={handleSave}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xl py-6 rounded-2xl flex items-center justify-center gap-3 transition-all"
                >
                    <Save /> Save All Settings
                </button>
            </div>
        </div>
    );
}
