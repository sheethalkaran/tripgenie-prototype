import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FullItinerary, Activity } from '../services/geminiService';

interface TripMapProps {
  itinerary: FullItinerary;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

const MapResizer = ({ bounds }: { bounds: L.LatLngBoundsExpression }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && (bounds as any).length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    // Fix for map not rendering correctly in some containers
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [bounds, map]);
  return null;
};

const TripMap: React.FC<TripMapProps> = ({ itinerary }) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  
  const dayColors = ['#2D4DE0', '#1EB8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981'];

  const getAllMarkers = () => {
    const markers: { pos: [number, number], activity: Activity, day: number, distance?: number, time?: number }[] = [];
    itinerary.days.forEach(day => {
      day.activities.forEach((activity, idx) => {
        if (activity.lat && activity.lng) {
          let distance: number | undefined;
          let travelTime: number | undefined;

          if (idx > 0) {
            const prev = day.activities[idx - 1];
            if (prev.lat && prev.lng) {
              distance = calculateDistance(prev.lat, prev.lng, activity.lat, activity.lng);
              travelTime = (distance / 40) * 60; // in minutes
            }
          }

          markers.push({
            pos: [activity.lat, activity.lng],
            activity,
            day: day.day,
            distance,
            time: travelTime
          });
        }
      });
    });
    return markers;
  };

  const markers = getAllMarkers();
  const bounds = L.latLngBounds(markers.map(m => m.pos));

  const getDayRoute = (dayNum: number) => {
    return markers
      .filter(m => m.day === dayNum)
      .map(m => m.pos);
  };

  return (
    <div className="space-y-6 mt-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Interactive Route Map 🗺️</h3>
          <p className="text-slate-500 text-sm font-medium">Visualizing your journey across {itinerary.days.length} days.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {itinerary.days.map(day => (
            <button
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                selectedDay === day.day 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
              }`}
            >
              Day {day.day}
            </button>
          ))}
          <button
            onClick={() => setSelectedDay(0)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              selectedDay === 0 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
            }`}
          >
            Show All
          </button>
        </div>
      </div>

      <div className="h-[600px] w-full rounded-[32px] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50 z-0 relative bg-slate-50">
        <MapContainer 
          bounds={bounds.isValid() ? bounds : undefined} 
          center={markers.length > 0 ? markers[0].pos : [0, 0]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {markers.map((m, idx) => (
            <CircleMarker 
              key={idx} 
              center={m.pos}
              radius={8}
              pathOptions={{
                fillColor: dayColors[(m.day - 1) % dayColors.length],
                fillOpacity: 1,
                color: '#ffffff',
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px] font-sans">
                  <div className="space-y-1.5">
                    <div className="text-xs">
                      <span className="font-black text-slate-900 uppercase tracking-tight">Location:</span>
                      <span className="ml-2 text-slate-600 font-bold">{m.activity.title}</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-black text-slate-900 uppercase tracking-tight">Time:</span>
                      <span className="ml-2 text-slate-600 font-bold">{m.activity.time}</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-black text-slate-900 uppercase tracking-tight">Activity:</span>
                      <span className="ml-2 text-slate-600 font-medium leading-relaxed">{m.activity.description}</span>
                    </div>
                  </div>
                  
                  {m.distance !== undefined && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <div className="text-[10px]">
                        <span className="font-black text-slate-400 uppercase tracking-widest">Distance from previous stop:</span>
                        <span className="ml-2 text-slate-900 font-black">{m.distance.toFixed(1)} km</span>
                      </div>
                      <div className="text-[10px]">
                        <span className="font-black text-slate-400 uppercase tracking-widest">Estimated travel time:</span>
                        <span className="ml-2 text-slate-900 font-black">{Math.round(m.time || 0)} minutes</span>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {itinerary.days.map(day => {
            if (selectedDay !== 0 && selectedDay !== day.day) return null;
            const route = getDayRoute(day.day);
            if (route.length < 2) return null;
            
            return (
              <Polyline 
                key={day.day}
                positions={route} 
                color={dayColors[(day.day - 1) % dayColors.length]} 
                weight={4}
                opacity={0.7}
                dashArray="10, 10"
              />
            );
          })}

          {bounds.isValid() && <MapResizer bounds={bounds} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default TripMap;
