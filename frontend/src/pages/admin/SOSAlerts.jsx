import React from 'react';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { AlertTriangle, ShieldCheck, MapPin, Phone, Radio, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SOSAlerts() {
  const navigate = useNavigate();
  const { adminSosAlerts, resolveSos, loadAdminData } = useHerRideStore();

  React.useEffect(() => {
    loadAdminData();
    // Poll SOS board every 5 seconds for real-time safety response
    const interval = setInterval(loadAdminData, 5000);
    return () => clearInterval(interval);
  }, [loadAdminData]);

  const activeAlerts = adminSosAlerts.filter(a => a.status === 'ACTIVE');
  const resolvedAlerts = adminSosAlerts.filter(a => a.status === 'RESOLVED');

  return (
    <div className="flex-1 bg-surface p-6 max-w-5xl mx-auto w-full min-h-[calc(100vh-68px)]">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/admin')}
          className="p-2.5 bg-white hover:bg-slate-50 border border-brandBorder rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brandText">Active SOS Dispatch Board</h1>
          <p className="text-xs text-brandText-muted font-medium">Real-time emergency panel listening to active rider panic actions.</p>
        </div>
      </div>

      {/* Grid splits into Active and Resolved */}
      <div className="space-y-8">
        
        {/* Active Emergency Section */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-danger mb-4 flex items-center gap-2">
            <Radio className="w-4.5 h-4.5 text-danger animate-pulse" />
            Active Alarms ({activeAlerts.length})
          </h2>

          {activeAlerts.length === 0 ? (
            <div className="bg-white border border-brandBorder rounded-3xl p-12 text-center shadow-sm">
              <ShieldCheck className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-700">All Systems Clear</h3>
              <p className="text-xs text-brandText-muted mt-1">There are no active SOS alarms across the HerRide network.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {activeAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="bg-red-50/20 border-2 border-danger rounded-3xl p-6 shadow-xl relative overflow-hidden animate-pulse"
                  style={{ animationDuration: '3s' }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-danger uppercase tracking-wider block">EMERGENCY ACTIVATED</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Alert ID: {alert.id}</span>
                    </div>
                    <span className="text-[10px] bg-danger text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Active
                    </span>
                  </div>

                  <div className="space-y-3.5 mb-6 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4.5 h-4.5 text-slate-400" />
                      <div>
                        <span className="block font-bold">{alert.user}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{alert.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4.5 h-4.5 text-danger" />
                      <div>
                        <span className="block font-bold">Coordinates Telemetry</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{alert.lat}, {alert.lng}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveSos(alert.id)}
                      className="w-full py-2.5 bg-danger text-white text-xs font-bold rounded-xl hover:bg-danger-dark transition shadow"
                    >
                      Verify Safe - Resolve SOS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Logs Section */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
            Resolved Alarm Logs ({resolvedAlerts.length})
          </h2>

          <div className="space-y-4">
            {resolvedAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="bg-white border border-brandBorder rounded-3xl p-5 shadow-sm flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{alert.user} ({alert.phone})</span>
                    <Badge variant="success">Resolved</Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Resolved Time: {alert.time}</span>
                </div>

                <span className="text-[10px] text-slate-400 font-semibold">Alert ID: {alert.id}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
