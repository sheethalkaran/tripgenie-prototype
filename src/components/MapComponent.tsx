import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type FullItinerary, type Activity } from '../services/geminiService';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  itinerary: FullItinerary;
}

// Haversine formula to calculate distance between two points in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const getTravelTime = (distance: number) => {
  const speed = 40; // 40 km/h
  const timeInHours = distance / speed;
  const timeInMinutes = Math.round(timeInHours * 60);
  return timeInMinutes;
};

// Component to handle auto-zoom and centering
const MapAutoZoom = ({ activities }: { activities: Activity[] }) => {
  const map = useMap();

  useEffect(() => {
    if (activities.length > 0) {
      const bounds = L.latLngBounds(activities.map(a => [a.lat!, a.lng!] as [number, number]));
      // Use smaller padding for small screens to ensure points are visible
      const padding: [number, number] = window.innerWidth < 768 ? [30, 30] : [60, 60];
      map.fitBounds(bounds, { padding });
      
      // Ensure map tiles are correctly loaded after container size changes
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activities, map]);

  return null;
};

const DAY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const MapComponent: React.FC<MapComponentProps> = ({ itinerary }) => {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

  const allActivities = itinerary.days.flatMap(day => 
    day.activities.map(activity => ({ ...activity, day: day.day }))
  ).filter(a => a.lat !== undefined && a.lng !== undefined);

  const filteredActivities = selectedDay === 'all' 
    ? allActivities 
    : allActivities.filter(a => a.day === selectedDay);

  const routes = itinerary.days.map((day, index) => {
    const dayActivities = day.activities.filter(a => a.lat !== undefined && a.lng !== undefined);
    const positions = dayActivities.map(a => [a.lat!, a.lng!] as [number, number]);
    return {
      day: day.day,
      positions,
      color: DAY_COLORS[index % DAY_COLORS.length]
    };
  });

  const filteredRoutes = selectedDay === 'all' 
    ? routes 
    : routes.filter(r => r.day === selectedDay);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col gap-4 shrink-0">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Interactive Route Map</h3>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              selectedDay === 'all' 
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            All Days
          </button>
          {itinerary.days.map((day) => (
            <button
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedDay === day.day 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[350px] md:min-h-[400px] w-full rounded-3xl overflow-hidden shadow-inner border border-slate-100 relative z-10">
        <MapContainer 
          center={[allActivities[0]?.lat || 0, allActivities[0]?.lng || 0]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredRoutes.map((route, idx) => (
            <Polyline 
              key={idx} 
              positions={route.positions} 
              color={route.color} 
              weight={5}
              opacity={0.9}
              dashArray="12, 12"
            />
          ))}

          {filteredActivities.map((activity, idx) => {
            // Find previous activity on the same day to calculate distance
            const dayActivities = allActivities.filter(a => a.day === activity.day);
            const actIdxInDay = dayActivities.findIndex(a => a.title === activity.title && a.time === activity.time);
            const prevActivity = actIdxInDay > 0 ? dayActivities[actIdxInDay - 1] : null;
            
            let distanceInfo = null;
            if (prevActivity) {
              const dist = calculateDistance(prevActivity.lat!, prevActivity.lng!, activity.lat!, activity.lng!);
              const time = getTravelTime(dist);
              distanceInfo = {
                dist: dist.toFixed(1),
                time
              };
            }

            return (
              <Marker 
                key={idx} 
                position={[activity.lat!, activity.lng!]}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="background-color: ${DAY_COLORS[(activity.day - 1) % DAY_COLORS.length]}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"></div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              >
                <Popup className="custom-popup">
                  <div className="p-2 space-y-2 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">Day {activity.day}</span>
                      <span className="text-[10px] font-bold text-slate-400">{activity.time}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">{activity.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{activity.description}</p>
                    
                    {distanceInfo && (
                      <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-400">Distance from prev:</span>
                          <span className="text-slate-900">{distanceInfo.dist} km</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-400">Est. travel time:</span>
                          <span className="text-slate-900">{distanceInfo.time} mins</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <MapAutoZoom activities={filteredActivities} />
        </MapContainer>
      </div>
    </div>
  );
};
