import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Shield, Upload, FileText, Camera, CheckCircle2, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Verification() {
  const navigate = useNavigate();
  const { driverDocs, uploadDriverDocs } = useHerRideStore();
  const [selfie, setSelfie] = useState(null);
  const [idCard, setIdCard] = useState(null);
  const [license, setLicense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vehicle Details States
  const [vehicleType, setVehicleType] = useState('SEDAN');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      uploadDriverDocs({
        selfie: selfie?.name || 'selfie.jpg',
        idCard: idCard?.name || 'id_card.pdf',
        license: license?.name || 'license.pdf'
      }, {
        vehicleType,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        plateNumber,
        vehicleColor,
        licenseNumber
      });
      setIsSubmitting(false);
    }, 1500);
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
          <h1 className="text-2xl font-display font-extrabold text-brandText">Verification Center</h1>
          <p className="text-xs text-brandText-muted font-medium">Upload government documents and profile selfie for admin verification.</p>
        </div>
      </div>

      {/* Verification Status Banner */}
      {driverDocs.status === 'APPROVED' && (
        <div className="bg-success-light border border-success/20 text-success-dark text-xs p-5 rounded-3xl mb-8 flex items-start gap-3.5 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
          <div>
            <div className="font-bold text-sm">Account Verified Successfully</div>
            <p className="text-[11px] text-success-dark/80 mt-1">Your credentials are approved. You are ready to went online and accept bookings!</p>
          </div>
        </div>
      )}

      {driverDocs.status === 'PENDING' && driverDocs.selfie && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-5 rounded-3xl mb-8 flex items-start gap-3.5 font-semibold">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="font-bold text-sm">Verification Pending Review</div>
            <p className="text-[11px] text-amber-700/80 mt-1">Admins are inspecting your documents. In dev simulation mode, approval completes automatically in 8 seconds.</p>
          </div>
        </div>
      )}

      {driverDocs.status === 'REJECTED' && (
        <div className="bg-danger-light border border-danger/20 text-danger-dark text-xs p-5 rounded-3xl mb-8 flex items-start gap-3.5 font-semibold">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
          <div>
            <div className="font-bold text-sm">Verification Suspended / Rejected</div>
            <p className="text-[11px] text-danger-dark/80 mt-1">Please re-upload valid matching government credentials and a clear face selfie.</p>
          </div>
        </div>
      )}

      <Card className="bg-white border border-brandBorder shadow-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            
            {/* Selfie Upload */}
            <div className="flex flex-col space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-primary" /> Profile Photo (Selfie)
              </span>
              <label className="border-2 border-dashed border-brandBorder hover:border-primary/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">
                  {selfie ? selfie.name : 'Click to upload portrait selfie'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">PNG, JPG, max 5MB</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setSelfie(e.target.files[0])} 
                  className="hidden" 
                  required={!driverDocs.selfie}
                />
              </label>
            </div>

            {/* ID Upload */}
            <div className="flex flex-col space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-secondary" /> National ID Card
              </span>
              <label className="border-2 border-dashed border-brandBorder hover:border-secondary/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">
                  {idCard ? idCard.name : 'Click to upload identity card'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">PDF, PNG, max 10MB</span>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={(e) => setIdCard(e.target.files[0])} 
                  className="hidden" 
                  required={!driverDocs.idCard}
                />
              </label>
            </div>

            {/* License Upload */}
            <div className="flex flex-col space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-accent" /> Driving License
              </span>
              <label className="border-2 border-dashed border-brandBorder hover:border-accent/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">
                  {license ? license.name : 'Click to upload driving license'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">PDF, PNG, max 10MB</span>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={(e) => setLicense(e.target.files[0])} 
                  className="hidden" 
                  required={!driverDocs.license}
                />
              </label>
            </div>

            {/* Vehicle & License details */}
            <div className="border-t border-brandBorder/60 pt-4 mt-6 space-y-4">
              <h3 className="text-sm font-display font-bold text-brandText">Vehicle & License Characteristics</h3>
              
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Vehicle Type</label>
                <select 
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-brandBorder rounded-2xl text-xs font-bold outline-none text-slate-700"
                >
                  <option value="SEDAN">Sedan Cab</option>
                  <option value="SUV">SUV Premium</option>
                  <option value="VAN">Van / Multi-purpose</option>
                  <option value="BIKE">Motorbike / Scooter</option>
                  <option value="TRICYCLE">Tricycle / Auto Rickshaw</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Make</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Hyundai"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-brandBorder rounded-2xl text-xs font-semibold outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Model</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Creta"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-brandBorder rounded-2xl text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Year</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 2023"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-brandBorder rounded-2xl text-xs font-semibold outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Color</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Silver"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-brandBorder rounded-2xl text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">License Plate Number</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. DL-3C-AS-1234"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-brandBorder rounded-2xl text-xs font-semibold outline-none"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Driving License Number</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. DL-1420230012345"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-brandBorder rounded-2xl text-xs font-semibold outline-none"
                />
              </div>
            </div>

          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3"
            disabled={isSubmitting || driverDocs.status === 'APPROVED'}
          >
            {isSubmitting ? 'Submitting Credentials...' : 'Submit Documents & Vehicle details'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
