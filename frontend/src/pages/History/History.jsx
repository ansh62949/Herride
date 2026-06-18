import React, { useState, useEffect } from 'react';
import { useHerRideStore } from '../../store/useHerRideStore';
import Badge from '../../components/ui/Badge';
import { Calendar, Clock, MapPin, Navigation, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const navigate = useNavigate();
  const { tripHistory, loadTripHistory } = useHerRideStore();
  const [activeTab, setActiveTab] = useState('Completed'); // Upcoming, Completed, Cancelled
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTripHistory();
  }, []);

  const getRidesList = () => {
    return tripHistory.filter(ride => {
      const status = ride.status ? ride.status.toUpperCase() : '';
      if (activeTab === 'Upcoming') {
        return status !== 'COMPLETED' && status !== 'CANCELLED';
      }
      if (activeTab === 'Completed') return status === 'COMPLETED';
      if (activeTab === 'Cancelled') return status === 'CANCELLED';
      return false;
    });
  };

  const filteredRides = getRidesList().filter(ride => 
    ride.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ride.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-surface p-5 flex flex-col justify-between overflow-y-auto min-h-[calc(100vh-68px)]">
      
      <div className="space-y-6 flex-grow">
        {/* Header */}
        <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
          <button onClick={() => navigate('/home')} className="p-2 border border-brandBorder rounded-xl text-slate-500 hover:bg-slate-50 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-display font-bold text-slate-800">History Log</h2>
            <span className="text-[9px] text-slate-400 font-semibold block uppercase">Travel Analytics</span>
          </div>
        </div>

        {/* Tab Controls (Figma Screens 45-47 style: Upcoming, Completed, Cancelled) */}
        <div className="grid grid-cols-3 bg-slate-100 p-1.5 rounded-2xl mb-4">
          {['Upcoming', 'Completed', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 text-[10px] font-extrabold rounded-xl transition ${
                activeTab === tab ? 'bg-white text-brandText shadow-sm' : 'text-brandText-muted hover:text-brandText'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-brandBorder rounded-2xl text-xs font-semibold outline-none focus:border-primary shadow-sm"
          />
        </div>

        {/* Dynamic List Render */}
        <div className="space-y-3">
          {filteredRides.length === 0 ? (
            <div className="bg-white border border-brandBorder rounded-[24px] p-8 text-center text-xs text-slate-400 font-medium">
              No history found in this category.
            </div>
          ) : (
            filteredRides.map((ride) => (
              <div 
                key={ride.id}
                className="p-4 bg-white border border-brandBorder rounded-[24px] shadow-card space-y-3.5"
              >
                {/* Meta details */}
                <div className="flex justify-between items-center border-b border-slate-50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Badge variant={ride.status?.toUpperCase() === 'COMPLETED' ? 'success' : ride.status?.toUpperCase() === 'CANCELLED' ? 'danger' : 'primary'}>
                      {ride.status}
                    </Badge>
                    <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" /> {ride.date || 'TBD'}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-primary">{ride.fare}</span>
                </div>

                {/* Locations path */}
                <div className="text-[11px] font-semibold text-slate-700 space-y-2">
                  <div className="flex items-start gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase">Pickup</span>
                      {ride.pickup}
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent mt-1 shrink-0" />
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase">Destination</span>
                      {ride.destination}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold border-t border-slate-50 pt-2.5">
                  <span>Driver: {ride.driver}</span>
                  <span>ID: {ride.id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
