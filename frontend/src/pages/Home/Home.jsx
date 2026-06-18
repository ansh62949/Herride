import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHerRideStore } from '../../store/useHerRideStore';
import HerRideMap from '../../components/maps/HerRideMap';
import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Shield,
  ShieldCheck, 
  Clock, 
  Search, 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  Share2, 
  CheckCircle, 
  Star,
  Check,
  Radio,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();
  const { 
    pickup, 
    destination, 
    setLocations, 
    rideTypes, 
    selectedRideType, 
    selectRideType, 
    bookRide, 
    currentTrip, 
    cancelRide, 
    triggerSos,
    submitIncidentReport,
    rateTrip,
    initializePayment,
    verifyPayment,
    clearCurrentTrip,
    chatHistory,
    sendChatMessage,
    loadChatHistory
  } = useHerRideStore();

  // Bottom Sheet States: 'LOCATIONS', 'TIERS', 'SEARCHING', 'TRACKING', 'COMPLETED'
  const [sheet, setSheet] = useState('LOCATIONS');
  
  // Dialog Overlays
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [complainOpen, setComplainOpen] = useState(false);
  const [complainCategory, setComplainCategory] = useState('UNSAFE_DRIVING');
  const [complainDesc, setComplainDesc] = useState('');
  const [complainSuccess, setComplainSuccess] = useState(false);

  // Payment UI states
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handlePaymentSubmit = async () => {
    if (!currentTrip) return;
    setPaymentLoading(true);
    setPaymentError('');
    const paymentData = await initializePayment(currentTrip.id);
    if (paymentData) {
      const isDemo = paymentData.reference && paymentData.reference.startsWith('demo-');
      if (isDemo) {
        setTimeout(async () => {
          await verifyPayment(paymentData.reference);
          setPaymentLoading(false);
        }, 1500);
        return;
      }
      setPaymentLoading(false);
      if (paymentData.authorizationUrl) {
        window.open(paymentData.authorizationUrl, '_blank');
      } else {
        setPaymentError('Failed to initialize payment gateway. Please try again.');
      }
    } else {
      setPaymentLoading(false);
      setPaymentError('Failed to initialize payment gateway. Please try again.');
    }
  };

  // Load chat history when chat dialog opens
  useEffect(() => {
    if (chatOpen && currentTrip?.id) {
      loadChatHistory(currentTrip.id);
    }
  }, [chatOpen, currentTrip?.id, loadChatHistory]);

  // Synchronize store trip status with sheet views
  useEffect(() => {
    if (!currentTrip) {
      if (sheet === 'SEARCHING' || sheet === 'TRACKING' || sheet === 'COMPLETED' || sheet === 'PAYMENT') {
        setSheet('LOCATIONS');
      }
    } else {
      if (currentTrip.status === 'COMPLETED') {
        if (currentTrip.paymentStatus === 'PENDING') {
          setSheet('PAYMENT');
        } else {
          setSheet('COMPLETED');
        }
      } else if (currentTrip.status === 'REQUESTED' || currentTrip.status === 'SEARCHING_DRIVER') {
        setSheet('SEARCHING');
      } else if (
        ['ACCEPTED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'RIDER_PICKED', 'IN_PROGRESS'].includes(currentTrip.status)
      ) {
        setSheet('TRACKING');
      }
    }
  }, [currentTrip?.status, currentTrip?.driver, currentTrip?.paymentStatus]);

  // Handle book confirm
  const handleConfirmLocations = (e) => {
    e.preventDefault();
    if (pickup && destination) {
      setSheet('TIERS');
    }
  };

  const handleBookNow = () => {
    bookRide();
    setSheet('SEARCHING');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !currentTrip?.id) return;
    sendChatMessage(currentTrip.id, chatMessage);
    setChatMessage('');
  };

  const submitReport = () => {
    submitIncidentReport({ category: complainCategory, description: complainDesc });
    setComplainDesc('');
    setComplainOpen(false);
    setComplainSuccess(true);
  };

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden">
      
      {/* Full Background Map Layer */}
      <div className="absolute inset-0 z-0">
        <HerRideMap />
      </div>

      {/* Floating Header Banner */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex justify-between">
        <div className="bg-white/95 backdrop-blur-xs border border-brandBorder px-3.5 py-1.5 rounded-2xl shadow-lg flex items-center gap-1.5 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-success animate-ping" />
          <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
            {sheet === 'TRACKING' ? currentTrip?.status.replace('_', ' ') : 'GPS Protected Mode'}
          </span>
        </div>
      </div>

      {/* BOTTOM ACTION SHEETS */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none p-4 flex flex-col justify-end">
        <AnimatePresence mode="wait">
          
          {/* SHEET 1: ENTER LOCATIONS */}
          {sheet === 'LOCATIONS' && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-[32px] p-5 shadow-2xl border border-brandBorder/60 w-full pointer-events-auto max-w-sm mx-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
              
              <div className="mb-4">
                <h3 className="text-base font-display font-extrabold text-slate-800">Where are you going?</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Verified female drivers, secure tracking.</p>
              </div>

              <form onSubmit={handleConfirmLocations} className="space-y-3">
                <div className="relative">
                  <div className="absolute left-[18px] top-9 w-0.5 h-10 bg-slate-200 border-dashed" />
                  
                  <Input
                    id="pLoc"
                    value={pickup}
                    onChange={(e) => setLocations(e.target.value, destination)}
                    placeholder="Enter pickup location"
                    iconBefore={<MapPin className="w-3.5 h-3.5 text-primary" />}
                    required
                  />

                  <div className="h-1" />

                  <Input
                    id="dLoc"
                    value={destination}
                    onChange={(e) => setLocations(pickup, e.target.value)}
                    placeholder="Enter destination location"
                    iconBefore={<Navigation className="w-3.5 h-3.5 text-accent" />}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-3 mt-2"
                  disabled={!pickup || !destination}
                >
                  Confirm Route
                </Button>
              </form>
            </motion.div>
          )}

          {/* SHEET 2: SELECT RIDE TIER */}
          {sheet === 'TIERS' && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-[32px] p-5 shadow-2xl border border-brandBorder/60 w-full pointer-events-auto max-w-sm mx-auto space-y-4"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2" />

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSheet('LOCATIONS')}
                  className="p-1.5 border border-brandBorder rounded-xl hover:bg-slate-50 transition"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
                <h3 className="text-sm font-display font-extrabold text-slate-800">Select Service Level</h3>
              </div>

              {/* Ride choices row (snapping horizontal scroll list like Uber/Ola) */}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 snap-x scrollbar-none">
                {rideTypes.map((type) => {
                  const isSelected = selectedRideType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() => selectRideType(type.id)}
                      className={`p-3 bg-white border-2 rounded-2xl cursor-pointer transition flex flex-col items-center justify-between text-center min-w-[105px] snap-center relative overflow-hidden ${
                        isSelected 
                          ? 'border-primary shadow-lg ring-1 ring-primary/10 bg-primary-light/5' 
                          : 'border-brandBorder hover:border-slate-300'
                      }`}
                    >
                      {/* Brand Pink/Purple vehicle SVGs */}
                      <div className="w-14 h-10 flex items-center justify-center mb-1 text-slate-700">
                        {type.id === 'bike' && (
                          <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                            <path d="M6 18h12M9 18l1-8h6M16 10l-2-6h-3M6 10H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {type.id === 'auto' && (
                          <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                            <path d="M6 18h12M5 18l1-10h10l1 10M10 8l-1-4h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {type.id === 'mini' && (
                          <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="2"/>
                            <path d="M3 15h18M4 15l1-5h14l1 5M7 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                        {type.id === 'sedan' && (
                          <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="5" cy="17" r="2.5" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="19" cy="17" r="2.5" stroke="currentColor" strokeWidth="2"/>
                            <path d="M2 14h20M3 14l1.5-6.5h15l1.5 6.5M6 7.5L8 3h8l2 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {type.id === 'suv' && (
                          <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="2"/>
                            <path d="M2 15h20M3 15l1-7h16l1 7M5 8l2-5h10l2 5M12 3v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-slate-800 block truncate">{type.name}</span>
                        <span className="text-[11px] font-black text-primary block">{type.price}</span>
                        <span className="text-[8px] text-slate-400 font-bold block">ETA: {type.eta}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button onClick={handleBookNow} className="w-full py-3">
                Confirm Booking
              </Button>
            </motion.div>
          )}

          {/* SHEET 3: RADAR SCAN MATCHING */}
          {sheet === 'SEARCHING' && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-[32px] p-6 shadow-2xl border border-brandBorder/60 w-full pointer-events-auto max-w-sm mx-auto text-center space-y-6"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
              
              <div className="space-y-1">
                <h3 className="text-base font-display font-extrabold text-slate-800">Matching with Driver</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Broadcasting Termii encrypted safety loops...</p>
              </div>

              {/* Pulsing radar ring */}
              <div className="w-28 h-28 mx-auto relative flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/5 rounded-full border border-primary/20 animate-radar-1" />
                <div className="absolute inset-4 bg-primary/10 rounded-full border border-primary/30 animate-radar-2" />
                <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow z-10">
                  <Shield className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <button
                onClick={() => { cancelRide(); setSheet('LOCATIONS'); }}
                className="w-full py-2.5 bg-slate-50 border border-brandBorder hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs transition"
              >
                Cancel Booking
              </button>
            </motion.div>
          )}

          {/* SHEET 4: ACTIVE TRIP TELEMETRY */}
          {sheet === 'TRACKING' && currentTrip && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-[32px] p-5 shadow-2xl border border-brandBorder/60 w-full pointer-events-auto max-w-sm mx-auto space-y-4"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-1" />

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Estimated Arrival</span>
                  <div className="text-xl font-display font-extrabold text-primary flex items-baseline gap-0.5">
                    {currentTrip.eta}
                    <span className="text-[9px] font-bold text-slate-400 ml-0.5">remaining</span>
                  </div>
                </div>
                
                <Badge variant="primary" className="py-0.5 px-2">
                  🔒 GPS Protected
                </Badge>
              </div>

              {/* Driver info block */}
              <div className="bg-slate-50 border border-brandBorder rounded-2xl p-3 flex items-center gap-3">
                <img 
                  src={currentTrip.driver?.photo || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover border border-primary/20"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 block truncate">{currentTrip.driver?.name}</span>
                    <span className="bg-primary/15 text-primary text-[7px] font-bold px-1 rounded-full uppercase shrink-0">Verified</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                    {currentTrip.driver?.car} • <span className="font-bold text-slate-700">{currentTrip.driver?.plate}</span>
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-800 block">★ {currentTrip.driver?.rating}</span>
                  <span className="text-[8px] text-slate-400 font-semibold block">Safety: {currentTrip.driver?.safetyScore}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${currentTrip.progress}%` }} />
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                  <span>TRIP TELEMETRY PROGRESS</span>
                  <span>{currentTrip.progress}%</span>
                </div>
              </div>

              {/* Action grid: Call, Chat, Share, SOS */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <button 
                  onClick={() => alert(`Calling driver ${currentTrip.driver?.name} at ${currentTrip.driver?.phone}...`)}
                  className="py-2.5 bg-white border border-brandBorder hover:bg-slate-50 text-slate-500 rounded-xl transition flex flex-col items-center justify-center gap-1"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-[9px] font-bold">Call</span>
                </button>
                
                <button 
                  onClick={() => setChatOpen(true)}
                  className="py-2.5 bg-white border border-brandBorder hover:bg-slate-50 text-slate-500 rounded-xl transition flex flex-col items-center justify-center gap-1"
                >
                  <MessageSquare className="w-4 h-4 text-secondary" />
                  <span className="text-[9px] font-bold">Chat</span>
                </button>
                
                <button 
                  onClick={() => setShareOpen(true)}
                  className="py-2.5 bg-white border border-brandBorder hover:bg-slate-50 text-slate-500 rounded-xl transition flex flex-col items-center justify-center gap-1"
                >
                  <Share2 className="w-4 h-4 text-accent" />
                  <span className="text-[9px] font-bold">Share</span>
                </button>
                
                <button 
                  onClick={triggerSos}
                  className="py-2.5 bg-danger-light border border-danger/20 hover:bg-danger/10 text-danger-dark rounded-xl transition flex flex-col items-center justify-center gap-1 animate-pulse"
                >
                  <AlertTriangle className="w-4 h-4 text-danger" />
                  <span className="text-[9px] font-extrabold uppercase">SOS</span>
                </button>
              </div>

              {currentTrip.status !== 'IN_PROGRESS' && (
                <button
                  onClick={async () => {
                    const ok = window.confirm("Are you sure you want to cancel this booking?");
                    if (ok) {
                      const success = await cancelRide();
                      if (success) {
                        setSheet('LOCATIONS');
                      }
                    }
                  }}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold rounded-xl text-[10px] transition uppercase tracking-wider mt-3"
                >
                  Cancel Ride
                </button>
              )}
            </motion.div>
          )}

          {/* SHEET 4.5: PAYMENT SHEET */}
          {sheet === 'PAYMENT' && currentTrip && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-[32px] p-6 shadow-2xl border border-brandBorder/60 w-full pointer-events-auto max-w-sm mx-auto text-center space-y-4"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
              
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-display font-extrabold text-slate-800">Trip Completed</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Please authorize payment to complete the journey.</p>

              <div className="bg-slate-50 border border-brandBorder/50 rounded-2xl p-4 text-left text-xs font-semibold space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Ride Fare:</span>
                  <span className="text-slate-800 font-extrabold text-sm">{currentTrip.fare}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-400">Driver Name:</span>
                  <span className="text-slate-700">{currentTrip.driver?.name || 'Assigned Driver'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle info:</span>
                  <span className="text-slate-700">{currentTrip.driver?.car} ({currentTrip.driver?.plate})</span>
                </div>
              </div>

              {paymentError && (
                <p className="text-[10px] text-danger font-bold text-center bg-danger-light/20 p-2.5 rounded-xl border border-danger/10">
                  {paymentError}
                </p>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={handlePaymentSubmit}
                  className="w-full py-3.5 text-xs font-bold"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? 'Redirecting to checkout...' : `Pay ${currentTrip.fare} now`}
                </Button>
                
                <button
                  onClick={() => {
                    clearCurrentTrip();
                    setSheet('LOCATIONS');
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs transition"
                >
                  Pay Later
                </button>
                
                <p className="text-[9px] text-slate-400 font-semibold">
                  Authorization will open in a secure Paystack sandbox window. Once complete, return here.
                </p>
              </div>
            </motion.div>
          )}

          {/* SHEET 5: COMPLETED RATING REVIEW */}
          {sheet === 'COMPLETED' && currentTrip && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-[32px] p-6 shadow-2xl border border-brandBorder/60 w-full pointer-events-auto max-w-sm mx-auto text-center space-y-4"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
              
              <div className="w-10 h-10 bg-success-light text-success rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-display font-extrabold text-slate-800">Journey Finished</h3>
              <p className="text-[10px] text-slate-400 font-semibold">You arrived safely at your destination. Rate your driver below.</p>

              <div className="flex justify-center gap-1.5 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRatingVal(star)}>
                    <Star className={`w-5 h-5 ${star <= ratingVal ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                  </button>
                ))}
              </div>

              <textarea 
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Leave private feedback..." 
                className="w-full p-2.5 bg-slate-50 border border-brandBorder rounded-xl text-[10px] font-semibold outline-none resize-none h-14"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setComplainOpen(true)}
                  className="py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                >
                  File Complaint
                </button>
                <Button 
                  onClick={async () => {
                    if (currentTrip && currentTrip.id) {
                      await rateTrip(currentTrip.id, ratingVal, feedbackText);
                      clearCurrentTrip();
                    }
                    setSheet('LOCATIONS');
                    setFeedbackText('');
                  }}
                  className="py-2.5 text-xs font-bold"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* DRIVER CHAT DIALOG OVERLAY */}
      <AnimatePresence>
        {chatOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end p-0">
            <motion.div 
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="bg-white rounded-t-[32px] w-full max-w-sm mx-auto flex flex-col h-[400px] shadow-2xl p-5 border-t border-brandBorder/60"
            >
              <div className="flex justify-between items-center pb-3 border-b border-brandBorder mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse shrink-0" />
                  <h3 className="text-xs font-bold text-slate-800">Chatting with {currentTrip?.driver?.name || 'Driver'}</h3>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Close</button>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[11px] font-semibold">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender?.toUpperCase() === 'RIDER' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2.5 rounded-2xl max-w-[80%] ${
                      msg.sender?.toUpperCase() === 'RIDER' ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                <input
                  type="text"
                  placeholder="Type message to driver..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-grow px-3 py-2 bg-slate-50 border border-brandBorder rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-primary"
                  required
                />
                <button type="submit" className="px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl">Send</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE STATUS DIALOG OVERLAY */}
      <AnimatePresence>
        {shareOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-5 shadow-2xl border border-brandBorder max-w-[280px] w-full text-center space-y-4"
            >
              <div className="w-10 h-10 bg-accent-light text-accent rounded-full flex items-center justify-center mx-auto">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-display font-bold text-slate-800">Share Telemetry Link</h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Guardians can monitor your coordinates live.</p>
              
              <div className="bg-slate-50 border border-brandBorder rounded-xl p-2.5 text-[10px] font-bold text-slate-700 select-all truncate">
                https://herri.de/track/trip_501
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setShareOpen(false)} 
                  className="py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                >
                  Close
                </button>
                <button 
                  onClick={() => { navigator.clipboard.writeText("https://herri.de/track/trip_501"); alert("Copied!"); setShareOpen(false); }}
                  className="py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-hover transition"
                >
                  Copy Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FIGMA COMPLAIN FORM DIALOG OVERLAY */}
      <AnimatePresence>
        {complainOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-5 shadow-2xl border border-brandBorder max-w-[320px] w-full text-left space-y-4"
            >
              <h3 className="text-sm font-display font-bold text-slate-800">File Incident Report</h3>
              
              <div className="space-y-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select 
                    value={complainCategory} 
                    onChange={(e) => setComplainCategory(e.target.value)}
                    className="p-2.5 bg-slate-50 border border-brandBorder rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="HARASSMENT">Harassment / Anomaly</option>
                    <option value="UNSAFE_DRIVING">Unsafe Driving</option>
                    <option value="VEHICLE_ISSUE">Vehicle / Cleanliness</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                  <textarea 
                    value={complainDesc}
                    onChange={(e) => setComplainDesc(e.target.value)}
                    placeholder="Provide incident details..."
                    className="w-full p-2.5 bg-slate-50 border border-brandBorder rounded-xl text-xs font-semibold outline-none resize-none h-20"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setComplainOpen(false)} 
                  className="py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitReport}
                  className="py-2 bg-danger text-white font-bold rounded-xl text-xs hover:bg-danger-dark transition"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FIGMA COMPLAIN SUCCESS MODAL */}
      <AnimatePresence>
        {complainSuccess && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-2xl border border-brandBorder max-w-[280px] w-full text-center space-y-4"
            >
              <div className="w-12 h-12 bg-success-light text-success rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-display font-bold text-slate-800">Send Successful</h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Your report has been logged. An agent will contact you shortly.</p>
              
              <Button onClick={() => { setComplainSuccess(false); setSheet('LOCATIONS'); }} className="w-full py-2">
                Back to Home
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
