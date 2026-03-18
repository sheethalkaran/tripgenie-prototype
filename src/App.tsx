/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Briefcase, 
  Utensils, 
  Plane, 
  MapPin, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Search,
  ArrowRight,
  Clock,
  Navigation,
  UtensilsCrossed,
  Download,
  Plus,
  MapPinned,
  Save,
  Copy,
  DollarSign,
  Info,
  BarChart3,
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Share2,
  Trash2,
  ExternalLink,
  CloudSun,
  Thermometer,
  ArrowLeft
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
// @ts-ignore
import { 
  generateItinerary, 
  generatePackingAudit, 
  generateFoodGuide,
  askConcierge,
  type ItineraryDay,
  type PackingItem,
  type FoodRecommendation,
  type FullItinerary,
  type Activity
} from './services/geminiService';
import { MapComponent } from './components/MapComponent';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Markdown from 'react-markdown';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'ITINERARY' | 'PACKING' | 'FOOD';
type View = 'HOME' | 'ITINERARY' | 'MY_TRIPS';

interface SavedTrip {
  id: string;
  title: string;
  destination: string;
  duration: number;
  data: FullItinerary;
  createdDate: string;
}

const Navbar = ({ onViewChange, currentView }: { onViewChange: (view: View) => void, currentView: View }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between glass-card px-8 py-3 bg-white/70">
      <button 
        onClick={() => onViewChange('HOME')}
        className="flex items-center gap-2"
      >
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
          T
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">TripGenie</span>
      </button>
      
      <div className="flex items-center gap-4 md:gap-8">
        <button 
          onClick={() => onViewChange('HOME')}
          className={cn(
            "text-[10px] md:text-xs font-bold tracking-widest transition-colors flex items-center gap-1.5",
            currentView === 'HOME' ? "text-primary" : "text-slate-500 hover:text-primary"
          )}
        >
          <Compass size={14} className="md:hidden" />
          <span className="hidden md:inline">PLANNER</span>
        </button>
        <button 
          onClick={() => onViewChange('MY_TRIPS')}
          className={cn(
            "text-[10px] md:text-xs font-bold tracking-widest transition-colors flex items-center gap-1.5",
            currentView === 'MY_TRIPS' ? "text-primary" : "text-slate-500 hover:text-primary"
          )}
        >
          <Briefcase size={14} className="md:hidden" />
          <span className="hidden md:inline">MY TRIPS</span>
        </button>
      </div>

      <button className="hidden sm:block bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200">
        Member Portal
      </button>
    </div>
  </nav>
);

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
    />
    <p className="text-slate-500 font-medium animate-pulse">{message}</p>
  </div>
);

const DayCard = ({ day, dayIdx }: { day: ItineraryDay, dayIdx: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <div className="relative bg-white rounded-[40px] p-6 md:p-8 shadow-sm border border-slate-50">
      {/* Day Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#1A365D] flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg shadow-blue-900/20 shrink-0">
            {day.day}
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Day {day.day}</h3>
            <p className="text-sky-600 font-bold text-xs md:text-sm uppercase tracking-widest">{day.theme}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 transition-transform duration-300",
            isExpanded ? "rotate-180" : ""
          )}>
            <ChevronRight size={20} className="rotate-90" />
          </div>
        </div>
      </button>

      {/* Activities Timeline */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-8 ml-6 md:ml-7 mt-8 border-l-2 border-slate-100 pl-8 md:pl-10 pb-4">
              {day.activities.map((activity, actIdx) => (
                <motion.div 
                  key={actIdx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: actIdx * 0.1 }}
                  className="relative bg-white rounded-3xl p-6 shadow-sm border border-slate-50 hover:shadow-md transition-shadow group"
                >
                  {/* Timeline Dot */}
                  <div className="absolute -left-[43px] md:-left-[51px] top-8 w-5 h-5 rounded-full bg-white border-4 border-[#1A365D] shadow-sm group-hover:scale-125 transition-transform" />
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sky-600 font-black text-xs uppercase tracking-widest">
                        <Clock size={14} />
                        {activity.time}
                      </div>
                      <h4 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{activity.title}</h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">
                        {activity.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 pt-2">
                        {activity.location && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                            <MapPin size={14} className="text-sky-400" />
                            {activity.location}
                          </div>
                        )}
                        {activity.cost && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                            <DollarSign size={14} className="text-emerald-400" />
                            {activity.cost}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ItineraryView = ({ 
  data, 
  onEdit, 
  onSave,
  onOpenMap
}: { 
  data: FullItinerary, 
  onEdit: () => void,
  onSave: () => void,
  onOpenMap: () => void
}) => {
  const COLORS = ['#1A1F2B', '#E11D48', '#0D9488', '#4F46E5'];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${data.title}\n\n${data.description}\n\n` + 
      data.days.map(day => `Day ${day.day}: ${day.theme}\n` + 
        day.activities.map(a => `- ${a.time}: ${a.title} (${a.description})`).join('\n')
      ).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12" id="itinerary-content">
      {/* Title Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white rounded-[40px] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-50">
        <div className="flex-1">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-600 mb-4 block">
            Confirmed Itinerary
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-4 leading-[1.1]">
            {data.title}
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl leading-relaxed text-base md:text-lg italic">
            "{data.description}"
          </p>
        </div>
        <div className="flex flex-col gap-3 min-w-[180px] no-print">
          <button 
            onClick={handleCopy}
            className={cn(
              "flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-xl hover:-translate-y-1",
              copied ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-slate-200/50"
            )}
          >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
          <button 
            onClick={onSave}
            className="flex items-center justify-center gap-3 bg-[#0D9488] text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-[#0B7A6F] transition-all shadow-xl shadow-teal-900/20 hover:-translate-y-1"
          >
            <Save size={16} />
            Save Trip
          </button>
          <button 
            onClick={onEdit}
            className="flex items-center justify-center gap-3 bg-slate-100 text-slate-500 px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-slate-200 transition-all hover:-translate-y-1"
          >
            Edit Plan
          </button>
          <button 
            onClick={() => document.getElementById('route-map')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center justify-center gap-3 bg-sky-50 text-sky-600 px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-sky-100 transition-all border border-sky-100 hover:-translate-y-1"
          >
            <MapPinned size={16} />
            Route Map
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Itinerary Timeline */}
        <div className="lg:col-span-7 space-y-12">
          {data.days.map((day, dayIdx) => (
            <DayCard key={dayIdx} day={day} dayIdx={dayIdx} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-5 space-y-8">
          <div className="sticky top-24 space-y-8">
            {/* Map Section */}
            <div id="route-map" className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-50 no-print">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <MapPin size={20} className="text-sky-500" />
                  Route Map
                </h4>
                <button 
                  onClick={onOpenMap}
                  className="p-2 bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-colors"
                  title="Full Screen Map"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
              <div className="h-[400px] rounded-3xl overflow-hidden border border-slate-100">
                <MapComponent itinerary={data} />
              </div>
            </div>

            {/* Budget Analysis */}
            <div className="bg-white rounded-[40px] p-6 shadow-xl shadow-slate-200/50 border border-slate-50">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shadow-sm">
                <BarChart3 size={20} />
              </div>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                Budget Analysis
              </h4>
            </div>
            
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={data.budgetAnalysis}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={8}
                    dataKey="percentage"
                    nameKey="category"
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {data.budgetAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '24px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                      padding: '12px 20px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 space-y-2">
              {data.budgetAnalysis.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                      {item.category}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Iconic Foods */}
          <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-50">
            <h4 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
              <Utensils size={24} className="text-orange-500" />
              Iconic Foods
            </h4>
            <div className="space-y-4">
              {data.localFoods.map((food, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                    🥘
                  </div>
                  <span className="text-sm font-black text-slate-700">{food}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Restaurants */}
          <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-50">
            <h4 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
              <MapPin size={24} className="text-sky-500" />
              Top Restaurants
            </h4>
            <div className="space-y-4">
              {data.recommendedRestaurants.map((rest, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-sky-500 shadow-sm group-hover:scale-110 transition-transform">
                    <Utensils size={20} />
                  </div>
                  <span className="text-sm font-black text-slate-700">{rest}</span>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyTripsView = ({ 
  trips, 
  onViewTrip, 
  onDeleteTrip 
}: { 
  trips: SavedTrip[], 
  onViewTrip: (trip: SavedTrip) => void,
  onDeleteTrip: (id: string) => void
}) => (
  <div className="space-y-12">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">My Saved Trips</h2>
        <p className="text-slate-500 font-medium">Your offline-ready travel collection</p>
      </div>
      <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
        <span className="text-2xl font-black text-primary">{trips.length}</span>
        <span className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Trips Saved</span>
      </div>
    </div>

    {trips.length === 0 ? (
      <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
          <Compass size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No trips saved yet</h3>
        <p className="text-slate-500 max-w-xs mx-auto mb-8">Start planning your next adventure and save it for offline access!</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trips.map((trip) => (
          <motion.div 
            key={trip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50 hover:shadow-xl transition-all duration-500 group"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Plane size={24} />
                </div>
                <button 
                  onClick={() => onDeleteTrip(trip.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight line-clamp-1">{trip.title}</h3>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                <MapPin size={14} className="text-sky-400" />
                {trip.destination}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">
                <Calendar size={14} className="text-emerald-400" />
                {new Date(trip.createdDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                  <span className="text-sm font-black text-slate-900">{trip.duration} Days</span>
                </div>
                <button 
                  onClick={() => onViewTrip(trip)}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  View Trip
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

const PackingView = ({ 
  data, 
  packedItems, 
  onToggleItem,
  extraItems,
  onAddExtraItem
}: { 
  data: PackingItem[], 
  packedItems: Set<string>,
  onToggleItem: (item: string) => void,
  extraItems: string[],
  onAddExtraItem: (item: string) => void
}) => {
  const categories = [
    { name: "Clothing", icon: "👕" },
    { name: "Footwear", icon: "👟" },
    { name: "Toiletries", icon: "🪥" },
    { name: "Health & Safety", icon: "💊" },
    { name: "Essentials & Accessories", icon: "🕶️" },
    { name: "Electronics and Extras", icon: "🔌" }
  ];

  const [newExtraItem, setNewExtraItem] = useState('');
  const [showExtraInput, setShowExtraInput] = useState(false);

  const totalItemsCount = data.length + extraItems.length;
  const progress = Math.round((packedItems.size / totalItemsCount) * 100) || 0;

  const handleAddExtra = () => {
    if (newExtraItem.trim()) {
      onAddExtraItem(newExtraItem.trim());
      setNewExtraItem('');
      setShowExtraInput(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Packing Readiness</span>
          <span className="text-xs font-bold text-slate-900 tracking-widest uppercase">{progress}% Complete</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-slate-900"
          />
        </div>
        <p className="text-xs text-slate-500 font-medium mt-3 text-center">{packedItems.size} of {totalItemsCount} items packed</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const items = data.filter(i => i.category === cat.name);
          const isExtrasCategory = cat.name === "Electronics and Extras";
          
          if (items.length === 0 && !isExtrasCategory) return null;

          return (
            <motion.div 
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                  <span className="text-xl">{cat.icon}</span>
                  {cat.name.toUpperCase()}
                </h4>
                {isExtrasCategory && (
                  <button 
                    onClick={() => setShowExtraInput(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                  >
                    Extra?
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const isPacked = packedItems.has(item.item);
                  return (
                    <label 
                      key={idx} 
                      className={cn(
                        "flex items-center gap-3 cursor-pointer group transition-all p-2 rounded-xl hover:bg-slate-50",
                      )}
                    >
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="peer sr-only"
                          checked={isPacked}
                          onChange={() => onToggleItem(item.item)}
                        />
                        <div className={cn(
                          "w-5 h-5 border-2 rounded-lg transition-all flex items-center justify-center",
                          isPacked ? "bg-slate-900 border-slate-900" : "border-slate-200"
                        )}>
                          {isPacked && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                      </div>
                      <span className={cn(
                        "text-sm font-medium text-slate-700 transition-all",
                        isPacked && "text-slate-400 line-through"
                      )}>
                        {item.item}
                      </span>
                    </label>
                  );
                })}
                {isExtrasCategory && extraItems.map((item, idx) => {
                  const isPacked = packedItems.has(item);
                  return (
                    <label 
                      key={`extra-${idx}`} 
                      className={cn(
                        "flex items-center gap-3 cursor-pointer group transition-all p-2 rounded-xl hover:bg-slate-50",
                      )}
                    >
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="peer sr-only"
                          checked={isPacked}
                          onChange={() => onToggleItem(item)}
                        />
                        <div className={cn(
                          "w-5 h-5 border-2 rounded-lg transition-all flex items-center justify-center",
                          isPacked ? "bg-slate-900 border-slate-900" : "border-slate-200"
                        )}>
                          {isPacked && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                      </div>
                      <span className={cn(
                        "text-sm font-medium text-slate-700 transition-all",
                        isPacked && "text-slate-400 line-through"
                      )}>
                        {item} <span className="text-[10px] text-primary font-bold ml-1">(EXTRA)</span>
                      </span>
                    </label>
                  );
                })}
                {isExtrasCategory && showExtraInput && (
                  <div className="flex gap-2 mt-4">
                    <input 
                      type="text" 
                      placeholder="Add item..."
                      className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary/10"
                      value={newExtraItem}
                      onChange={(e) => setNewExtraItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddExtra()}
                      autoFocus
                    />
                    <button 
                      onClick={handleAddExtra}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const FoodView = ({ 
  data, 
  onLoadMore, 
  isLoadingMore
}: { 
  data: FoodRecommendation[], 
  onLoadMore: () => void,
  isLoadingMore: boolean
}) => (
  <div className="space-y-8" id="food-content">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {data.map((food, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (idx % 6) * 0.1 }}
          whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
          className="bg-white rounded-[32px] p-8 shadow-sm transition-all duration-500 flex flex-col group border border-slate-50 relative"
        >
          {/* Food Emoji at top-left */}
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
            {food.emoji || "🍜"}
          </div>

          {/* Restaurant Label Badge at top-right */}
          <div className="absolute top-8 right-8">
            <span className="inline-block bg-sky-50 text-sky-600 text-[9px] font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full">
              {food.restaurantLabel}
            </span>
          </div>

          {/* Food Name in Bold */}
          <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{food.name}</h4>

          {/* Short Description */}
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-1">
            {food.description}
          </p>
          
          {/* Location Row at bottom with location icon */}
          <div className="pt-6 border-t border-slate-50 flex items-center gap-2 text-slate-400">
            <MapPin size={14} className="text-sky-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">BEST SPOT: <span className="text-slate-900">{food.bestSpot}</span></span>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Bottom Action Buttons */}
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4">
      <button 
        onClick={onLoadMore}
        disabled={isLoadingMore}
        className="bg-white border-2 border-slate-100 text-slate-900 px-12 py-5 rounded-[24px] font-black hover:bg-slate-50 transition-all flex items-center gap-3 disabled:opacity-50 shadow-sm min-w-[240px] justify-center tracking-tight"
      >
        {isLoadingMore ? (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full"
          />
        ) : (
          <>Load Extra Foods <span className="text-xl">🍱</span></>
        )}
      </button>
    </div>
  </div>
);

const LoadingModal = ({ isOpen }: { isOpen: boolean }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="glass-card p-12 max-w-sm w-full text-center flex flex-col items-center"
        >
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-8 shadow-inner"
          >
            <Plane size={48} />
          </motion.div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Hang tight!</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            Polishing your custom guide...<br />
            Our AI is crafting the perfect route.
          </p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Chatbot = ({ tripContext }: { tripContext?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Greetings! I am TripGenie, your personal travel concierge. How may I assist your wanderlust today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await askConcierge(userMessage, tripContext);
      setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that request." }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-300",
              isMinimized ? "h-20 w-80" : "h-[600px] w-[400px] max-w-full"
            )}
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  G
                </div>
                <div>
                  <h4 className="text-white font-black text-sm tracking-tight">Concierge Genie</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                  {messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                        msg.role === 'user' 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                      )}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm prose-slate max-w-none">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-6 bg-white border-t border-slate-100">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Inquire about anything..."
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-6 pr-14 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 top-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/40 relative group"
        >
          <MessageCircle size={28} />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Chat with Genie</span>
          </div>
        </motion.button>
      )}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ITINERARY');
  const [currentView, setCurrentView] = useState<View>('HOME');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState(3);
  const [budget, setBudget] = useState('Moderate');
  const [travelerType, setTravelerType] = useState('Solo');
  const [interests, setInterests] = useState('');
  const [extraRequirements, setExtraRequirements] = useState('');
  const [useSearch, setUseSearch] = useState(false);

  // Saved Trips State
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  // Packing Specific State
  const [packingWeather, setPackingWeather] = useState('Hot / Summer');
  const [packingDuration, setPackingDuration] = useState(3);
  
  // Sync packing duration with itinerary duration
  useEffect(() => {
    setPackingDuration(duration);
  }, [duration]);

  const [packingActivities, setPackingActivities] = useState('');
  const [packedItems, setPackedItems] = useState<Set<string>>(new Set());
  const [extraPackingItems, setExtraPackingItems] = useState<string[]>([]);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [itinerary, setItinerary] = useState<FullItinerary | null>(null);
  const [packing, setPacking] = useState<PackingItem[] | null>(null);
  const [food, setFood] = useState<FoodRecommendation[] | null>(null);

  // Load saved trips on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedTrips');
    if (saved) {
      try {
        setSavedTrips(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved trips', e);
      }
    }
  }, []);

  // Auto-load food if destination exists
  useEffect(() => {
    if (activeTab === 'FOOD' && destination && !food && !loading) {
      handleGenerate();
    }
  }, [activeTab]);

  const handleSaveTrip = () => {
    if (!itinerary) return;
    
    const newTrip: SavedTrip = {
      id: Date.now().toString(),
      title: itinerary.title,
      destination: destination,
      duration: duration,
      data: itinerary,
      createdDate: new Date().toISOString()
    };

    const updated = [newTrip, ...savedTrips];
    setSavedTrips(updated);
    localStorage.setItem('savedTrips', JSON.stringify(updated));
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const handleDeleteTrip = (id: string) => {
    const updated = savedTrips.filter(t => t.id !== id);
    setSavedTrips(updated);
    localStorage.setItem('savedTrips', JSON.stringify(updated));
  };

  const handleViewTrip = (trip: SavedTrip) => {
    setItinerary(trip.data);
    setDestination(trip.destination);
    setDuration(trip.duration);
    setCurrentView('ITINERARY');
  };


  const handleGenerate = async () => {
    if (!destination) return;
    
    const finalDuration = Math.max(1, duration || 1);
    const finalPackingDuration = Math.max(1, packingDuration || 1);

    // Check cache first
    const cacheKey = `cache_${activeTab}_${destination}_${finalDuration}_${budget}_${travelerType}_${interests}_${extraRequirements}_${useSearch}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (activeTab === 'ITINERARY') setItinerary(data);
        else if (activeTab === 'PACKING') setPacking(data);
        else if (activeTab === 'FOOD') setFood(data);
        
        setTimeout(() => {
          document.getElementById('results-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return;
      } catch (e) {
        console.error('Failed to parse cache', e);
      }
    }

    setLoading(true);
    try {
      let res;
      if (activeTab === 'ITINERARY') {
        res = await generateItinerary(
          destination, 
          finalDuration, 
          interests || 'culture, food, hidden gems',
          budget,
          travelerType,
          useSearch,
          extraRequirements
        );
        setItinerary(res);
      } else if (activeTab === 'PACKING') {
        res = await generatePackingAudit(
          destination, 
          packingWeather, 
          finalPackingDuration, 
          packingActivities || 'General sightseeing'
        );
        setPacking(res);
        setPackedItems(new Set());
      } else if (activeTab === 'FOOD') {
        res = await generateFoodGuide(destination);
        setFood(res);
      }
      
      // Save to cache
      if (res) {
        localStorage.setItem(cacheKey, JSON.stringify(res));
      }
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMoreFoods = async () => {
    if (!destination || !food) return;
    setLoadingMore(true);
    try {
      // Show loading animation for at least 1 second
      const [res] = await Promise.all([
        generateFoodGuide(destination, 6, food.map(f => f.name)),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
      setFood(prev => prev ? [...prev, ...res] : res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleItem = (item: string) => {
    setPackedItems(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  return (
    <div className="pt-32 pb-20 px-6">
      <Navbar onViewChange={setCurrentView} currentView={currentView} />
      <LoadingModal isOpen={loading} />
      
      {/* Save Toast */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[110] bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm tracking-widest uppercase shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 size={20} />
            Trip Saved Successfully!
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="max-w-7xl mx-auto">
        {currentView === 'MY_TRIPS' ? (
          <MyTripsView 
            trips={savedTrips} 
            onViewTrip={handleViewTrip} 
            onDeleteTrip={handleDeleteTrip} 
          />
        ) : (
          <>
            {/* Hero Section */}
            <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-text mb-4"
          >
            Plan Your Journey.<br />
            <span className="text-primary">No Delays.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-8"
          >
            Lightning-fast AI itineraries and professional packing audits. 
            Experience travel planning at the speed of thought.
          </motion.p>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto glass-card p-2 flex flex-col sm:flex-row items-center gap-2 mb-8"
          >
            <div className="w-full sm:flex-1 flex items-center gap-3 px-4 py-2 sm:py-0">
              <Search className="text-slate-400 shrink-0" size={20} />
              <input 
                type="text" 
                placeholder="Where are you going?"
                className="w-full bg-transparent border-none outline-none text-base md:text-lg font-medium placeholder:text-slate-300"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <button 
              onClick={handleGenerate}
              className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/20"
            >
              Generate <Sparkles size={18} />
            </button>
          </motion.div>

          {/* Segmented Control */}
          <div className="flex justify-center mb-6">
            <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1">
              {(['ITINERARY', 'PACKING', 'FOOD'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-8 py-3 rounded-xl text-xs font-bold tracking-widest transition-all",
                    activeTab === tab 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]" id="results-container">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingState message={`Generating your ${activeTab.toLowerCase()}...`} />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {activeTab === 'ITINERARY' && (
                  itinerary ? (
                    <ItineraryView 
                      data={itinerary} 
                      onEdit={() => setItinerary(null)} 
                      onSave={handleSaveTrip}
                      onOpenMap={() => setIsMapFullScreen(true)}
                    />
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-3xl mx-auto bg-white rounded-[40px] p-16 shadow-xl shadow-slate-200/50 border border-slate-50"
                    >
                      <div className="mb-8">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tighter">Journey Blueprint 🗺️</h2>
                        <p className="text-slate-500 text-lg font-medium">Define your vibe and let our AI craft the perfect route.</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-6">
                          <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">📍 Where to?</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                placeholder="Tokyo, Paris, Bali..."
                                className="w-full bg-slate-50 border-none rounded-[24px] py-6 px-8 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">⏳ Duration (Days)</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                min="1"
                                max="30"
                                className="w-full bg-slate-50 border-none rounded-[24px] py-6 px-8 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all"
                                value={duration || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDuration(val === '' ? 0 : parseInt(val) || 0);
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">💰 Budget</label>
                            <select 
                              className="w-full bg-slate-50 border-none rounded-[24px] py-6 px-8 text-lg font-bold text-slate-900 focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
                              value={budget}
                              onChange={(e) => setBudget(e.target.value)}
                            >
                              <option>Budget</option>
                              <option>Moderate</option>
                              <option>Luxury</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-10">
                          <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">👥 Traveler Type</label>
                            <select 
                              className="w-full bg-slate-50 border-none rounded-[24px] py-6 px-8 text-lg font-bold text-slate-900 focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
                              value={travelerType}
                              onChange={(e) => setTravelerType(e.target.value)}
                            >
                              <option>Solo</option>
                              <option>Couple</option>
                              <option>Friends</option>
                              <option>Family</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">🎭 Interests</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                placeholder="Art, Food, Nightlife, Nature..."
                                className="w-full bg-slate-50 border-none rounded-[24px] py-6 px-8 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all"
                                value={interests}
                                onChange={(e) => setInterests(e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">📝 Extra Requirements</label>
                            <div className="relative">
                              <textarea 
                                placeholder="e.g., within 10km, kid-friendly, wheelchair accessible..."
                                className="w-full bg-slate-50 border-none rounded-[24px] py-6 px-8 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all min-h-[120px] resize-none"
                                value={extraRequirements}
                                onChange={(e) => setExtraRequirements(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="pt-4">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative">
                                <input 
                                  type="checkbox" 
                                  className="peer sr-only"
                                  checked={useSearch}
                                  onChange={(e) => setUseSearch(e.target.checked)}
                                />
                                <div className="w-12 h-6 bg-slate-200 rounded-full peer-checked:bg-primary transition-colors" />
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-sm" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700">Include Google Search Grounding</span>
                                <span className="text-[10px] font-medium text-slate-400">(Slower but accurate)</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleGenerate}
                        disabled={!destination}
                        className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        Generate Itinerary <ArrowRight size={20} />
                      </button>
                    </motion.div>
                  )
                )}
                {activeTab === 'PACKING' && (
                  packing ? (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between glass-card p-6">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">{destination}</h2>
                          <p className="text-slate-500 font-medium">{packingDuration} Days • {packingWeather} • {packingActivities || 'General'}</p>
                        </div>
                        <button 
                          onClick={() => setPacking(null)}
                          className="text-sm font-bold text-primary hover:underline"
                        >
                          Edit Checklist
                        </button>
                      </div>
                      <PackingView 
                        data={packing} 
                        packedItems={packedItems} 
                        onToggleItem={handleToggleItem} 
                        extraItems={extraPackingItems}
                        onAddExtraItem={(item) => setExtraPackingItems(prev => [...prev, item])}
                      />
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-3xl mx-auto bg-white rounded-[40px] p-16 shadow-xl shadow-slate-200/50 border border-slate-50"
                    >
                      <div className="mb-8">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tighter">Smart Checklist 🎒</h2>
                        <p className="text-slate-500 text-lg font-medium">Never forget an essential. Tailored lists for your destination.</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-6">
                          <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">✈️ Destination</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                placeholder="Where are you going?"
                                className="w-full bg-slate-50 border-none rounded-[24px] py-6 px-8 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">⛅ Weather Type</label>
                            <select 
                              className="w-full bg-slate-50 border-none rounded-[24px] py-6 px-8 text-lg font-bold text-slate-900 focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
                              value={packingWeather}
                              onChange={(e) => setPackingWeather(e.target.value)}
                            >
                              <option>Hot / Summer</option>
                              <option>Cold / Winter</option>
                              <option>Rainy</option>
                              <option>Mixed</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-10">
                          <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">⏳ Trip Duration</label>
                            <input 
                              type="number" 
                              min="1"
                              className="w-full bg-slate-50 border-none rounded-[24px] py-6 px-8 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all"
                              value={packingDuration || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPackingDuration(val === '' ? 0 : parseInt(val) || 0);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">🎭 Main Activities</label>
                            <input 
                              type="text" 
                              placeholder="Hiking, Work, Parties..."
                              className="w-full bg-slate-50 border-none rounded-[24px] py-6 px-8 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all"
                              value={packingActivities}
                              onChange={(e) => setPackingActivities(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleGenerate}
                        disabled={!destination}
                        className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        Generate Packing List <ArrowRight size={20} />
                      </button>
                    </motion.div>
                  )
                )}
                {activeTab === 'FOOD' && (
                  food ? (
                    <div className="space-y-12">
                      <div className="flex items-center justify-between bg-white rounded-[32px] p-10 shadow-sm border border-slate-50">
                        <div>
                          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Taste Scout 🍜</h2>
                          <p className="text-slate-500 font-medium">Discover authentic flavors in {destination}.</p>
                        </div>
                        <button 
                          onClick={() => setFood(null)}
                          className="bg-slate-50 text-slate-400 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:text-primary transition-all"
                        >
                          New Search
                        </button>
                      </div>
                      <FoodView 
                        data={food} 
                        onLoadMore={handleLoadMoreFoods}
                        isLoadingMore={loadingMore}
                      />
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-3xl mx-auto bg-white rounded-[40px] p-16 shadow-xl shadow-slate-200/50 border border-slate-50"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tighter">Taste Scout 🍜</h2>
                        <p className="text-slate-500 text-lg font-medium">Discover authentic flavors based on local culinary data.</p>
                      </div>

                      <div className="space-y-6 mb-6">
                        <div>
                          <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">🍜 Region or City</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="e.g. Tokyo, Paris, Mangalore..."
                              className="w-full bg-slate-50 border-none rounded-[24px] py-6 px-8 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all"
                              value={destination}
                              onChange={(e) => setDestination(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleGenerate}
                        disabled={!destination}
                        className="w-full bg-[#1A365D] text-white py-6 rounded-[24px] font-black text-xl hover:bg-[#152C4D] transition-all hover:shadow-2xl hover:shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 tracking-tight"
                      >
                        FETCH CULINARY INSIGHTS <ArrowRight size={24} />
                      </button>
                    </motion.div>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-32 pt-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 text-sm font-medium">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center text-slate-500 font-bold text-xs">T</div>
          <span>© 2026 TripGenie AI. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
          <a href="#" className="hover:text-primary transition-colors">Support</a>
        </div>
      </footer>

      <Chatbot tripContext={itinerary ? JSON.stringify(itinerary) : undefined} />

      {/* Full Screen Map Modal - Moved to root for z-index isolation */}
      <AnimatePresence>
        {isMapFullScreen && itinerary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900 flex flex-col"
          >
            <div className="p-4 md:p-6 flex items-center justify-between bg-slate-900 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  M
                </div>
                <h4 className="text-white font-black text-sm md:text-lg tracking-tight truncate max-w-[200px] md:max-w-none">{itinerary.title} - Route Map</h4>
              </div>
              <button 
                onClick={() => setIsMapFullScreen(false)}
                className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 relative bg-slate-900">
              <MapComponent itinerary={itinerary} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
