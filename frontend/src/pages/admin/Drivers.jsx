import React, { useState } from 'react';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Shield, Check, X, ShieldAlert, Award, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Drivers() {
  const navigate = useNavigate();
  const { allDrivers, adminVerifyDriver, loadAdminData } = useHerRideStore();
  const [selectedDriver, setSelectedDriver] = useState(null);

  React.useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  return (
    <div className="flex-1 bg-surface p-6 max-w-6xl mx-auto w-full min-h-[calc(100vh-68px)]">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/admin')}
          className="p-2.5 bg-white hover:bg-slate-50 border border-brandBorder rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brandText">Driver Verification Panel</h1>
          <p className="text-xs text-brandText-muted font-medium">Verify driver background checks, selfies, and vehicle registration credentials.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left side: Drivers list */}
        <div className="md:col-span-2 space-y-4">
          {allDrivers.map((drv) => (
            <div 
              key={drv.id}
              onClick={() => setSelectedDriver(drv)}
              className={`p-5 bg-white border rounded-3xl shadow-card cursor-pointer transition flex justify-between items-center ${
                selectedDriver?.id === drv.id 
                  ? 'border-primary shadow-lg ring-1 ring-primary/20' 
                  : 'border-brandBorder hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">{drv.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">ID: {drv.id}</span>
                </div>
                <div className="text-[11px] text-brandText-muted font-medium mt-1">
                  {drv.car} • <span className="font-bold text-slate-700">{drv.licensePlate}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={
                  drv.isVerified === 'APPROVED' ? 'success' : 
                  drv.isVerified === 'PENDING' ? 'primary' : 'danger'
                }>
                  {drv.isVerified}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Right side: Driver Document Review Inspection Card */}
        <div className="md:col-span-1">
          {selectedDriver ? (
            <Card className="bg-white border border-brandBorder shadow-card p-6 sticky top-24">
              <CardHeader className="pb-3 border-b-0 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-bold">{selectedDriver.name}</CardTitle>
                    <CardDescription>Review credentials below</CardDescription>
                  </div>
                  <Badge variant={selectedDriver.isVerified === 'APPROVED' ? 'success' : 'neutral'}>
                    {selectedDriver.isVerified}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                                {/* Simulated Documents info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-slate-50 border border-brandBorder rounded-xl p-3 text-xs font-semibold">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <span className="block font-bold">Government ID Check</span>
                      <span className="text-[10px] text-slate-400 font-semibold">National ID Database Passed</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 border border-brandBorder rounded-xl p-3 text-xs font-semibold">
                    <FileText className="w-5 h-5 text-secondary" />
                    <div>
                      <span className="block font-bold">Driving License</span>
                      <span className="text-[10px] text-slate-400 font-semibold">License Plate matching check passed</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-primary-light/25 border border-primary/25 rounded-xl p-3 text-xs font-semibold">
                    <Award className="w-5 h-5 text-primary" />
                    <div>
                      <span className="block font-bold">Driver Lifetime Earnings</span>
                      <span className="text-[10px] text-primary font-extrabold">₹{selectedDriver.earnings || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Review Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      adminVerifyDriver(selectedDriver.id, 'REJECTED');
                      setSelectedDriver({ ...selectedDriver, isVerified: 'REJECTED' });
                    }}
                    className="flex-1 py-2.5 bg-danger-light text-danger border border-danger/20 hover:bg-danger/10 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <X className="w-4 h-4" /> Reject/Suspend
                  </button>
                  <button
                    onClick={() => {
                      adminVerifyDriver(selectedDriver.id, 'APPROVED');
                      setSelectedDriver({ ...selectedDriver, isVerified: 'APPROVED' });
                    }}
                    className="flex-1 py-2.5 bg-success-light text-success-dark border border-success/20 hover:bg-success/10 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Approve Driver
                  </button>
                </div>

              </CardContent>
            </Card>
          ) : (
            <div className="bg-white border border-brandBorder rounded-3xl p-6 text-center text-xs text-slate-400 font-semibold sticky top-24">
              Select a driver profile from the list to review documents and approve.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
