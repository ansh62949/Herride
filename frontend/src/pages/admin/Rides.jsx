import React, { useState } from 'react';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Car, 
  IndianRupee, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Compass, 
  Filter 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Rides() {
  const navigate = useNavigate();
  const { allTrips, loadAdminData } = useHerRideStore();
  const [statusFilter, setStatusFilter] = useState('ALL');

  React.useEffect(() => {
    loadAdminData();
    // Poll rides list every 8 seconds for active updates
    const interval = setInterval(loadAdminData, 8000);
    return () => clearInterval(interval);
  }, [loadAdminData]);

  const filteredTrips = statusFilter === 'ALL'
    ? allTrips
    : allTrips.filter(t => t.status === statusFilter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'REQUESTED':
        return <Badge variant="primary">Requested</Badge>;
      case 'ACCEPTED':
      case 'DRIVER_EN_ROUTE':
      case 'ARRIVED':
      case 'IN_PROGRESS':
        return <Badge variant="neutral">Active ({status.replace('_', ' ')})</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const statusOptions = ['ALL', 'REQUESTED', 'ACCEPTED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="flex-1 bg-surface p-6 max-w-6xl mx-auto w-full min-h-[calc(100vh-68px)]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2.5 bg-white hover:bg-slate-50 border border-brandBorder rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-extrabold text-brandText">System Rides Monitor</h1>
            <p className="text-xs text-brandText-muted font-medium">Real-time status tracking, address details, and financial telemetry for all bookings.</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 bg-white border border-brandBorder p-1.5 rounded-2xl shadow-sm self-stretch md:self-auto overflow-x-auto">
          <div className="flex items-center gap-1 text-slate-400 px-2 shrink-0">
            <Filter className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Status:</span>
          </div>
          {statusOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt)}
              className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase transition shrink-0 ${
                statusFilter === opt
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {opt.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white border border-brandBorder rounded-3xl overflow-hidden shadow-card">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-semibold text-xs">
            No bookings found matching selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brandBorder bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Ride ID</th>
                  <th className="py-4 px-6">Commute Date</th>
                  <th className="py-4 px-6">Rider Details</th>
                  <th className="py-4 px-6">Driver Details</th>
                  <th className="py-4 px-6">Route Details</th>
                  <th className="py-4 px-6">Total Fare</th>
                  <th className="py-4 px-6">Driver Earning</th>
                  <th className="py-4 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brandBorder text-xs text-slate-700 font-semibold">
                {filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-5 px-6 font-bold text-slate-900">#{trip.id}</td>
                    <td className="py-5 px-6 text-slate-400 font-bold">{trip.date}</td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-light text-primary rounded-xl flex items-center justify-center font-bold text-[10px]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold text-slate-800">{trip.riderName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-secondary-light text-secondary rounded-xl flex items-center justify-center font-bold text-[10px]">
                          <Car className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-bold text-slate-800">{trip.driverName}</span>
                          <span className="text-[9px] text-slate-400 font-bold block">{trip.vehicleType}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 max-w-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate block max-w-[200px]" title={trip.pickup}>{trip.pickup}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span className="truncate block max-w-[200px]" title={trip.destination}>{trip.destination}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 font-bold text-slate-800">{trip.fare}</td>
                    <td className="py-5 px-6 text-emerald-600 font-extrabold">{trip.driverEarnings}</td>
                    <td className="py-5 px-6 text-right">{getStatusBadge(trip.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
