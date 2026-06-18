import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Shield, AlertTriangle, Phone, PhoneCall, ShieldAlert, ArrowLeft, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Safety() {
  const navigate = useNavigate();
  const { currentTrip, triggerSos, activeSosAlert } = useHerRideStore();

  const handlePanic = () => {
    triggerSos();
  };

  return (
    <div className="flex-1 bg-surface p-6 max-w-3xl mx-auto w-full min-h-[calc(100vh-68px)]">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/driver')}
          className="p-2.5 bg-white hover:bg-slate-50 border border-brandBorder rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brandText">Driver Safety Center</h1>
          <p className="text-xs text-brandText-muted font-medium">Quick emergency panics and support lines for drivers on shift.</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Large red Emergency alert button */}
        <Card className="bg-red-50 border border-red-200 shadow-lg text-center p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg mb-4 animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-bold font-display text-red-700 mb-2">Driver SOS Alarm</h3>
          <p className="text-xs text-red-600 max-w-sm mb-6 leading-relaxed">
            Activating this alarm immediately routes GPS telemetry to the HerRide dispatch room and calls highway support.
          </p>

          <button
            onClick={handlePanic}
            className="px-8 py-3 bg-red-600 text-white font-extrabold text-xs rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/30 transition uppercase tracking-wider"
          >
            Trigger Dispatch Panic
          </button>
        </Card>

        {/* Support contacts */}
        <div className="flex flex-col gap-4">
          <Card className="bg-white border border-brandBorder p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-light text-primary rounded-xl flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Security Command</span>
              <span className="text-sm font-bold text-slate-800 block">+1 (555) SOS-HELP</span>
            </div>
          </Card>

          <Card className="bg-white border border-brandBorder p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Driver General Line</span>
              <span className="text-sm font-bold text-slate-800 block">+1 (555) DRV-SUPP</span>
            </div>
          </Card>
        </div>

        {/* Report passenger warning */}
        <Card className="bg-white border border-brandBorder p-6">
          <CardHeader className="pb-2 border-b-0 mb-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-slate-500" />
              Flag Anomaly or Report Passenger
            </CardTitle>
            <CardDescription>File feedback on passenger behavior. Checked by safety admins.</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => alert('Opening report form...')}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-brandBorder text-slate-600 text-xs font-bold rounded-xl transition"
            >
              Report Passenger Behavior
            </button>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
