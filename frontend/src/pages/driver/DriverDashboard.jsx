import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { IndianRupee, Clock, CheckCircle, Radio, User, MapPin, Navigation, ShieldCheck, Star, ShieldAlert, MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { 
    user, 
    driverOnline, 
    toggleDriverOnline, 
    driverEarnings, 
    incomingRideRequest, 
    driverAcceptTrip, 
    driverRejectTrip,
    currentTrip,
    driverDocs,
    loadDriverProfile,
    driverUpdateTripStatus,
    cancelRide,
    chatHistory,
    sendChatMessage,
    loadChatHistory
  } = useHerRideStore();

  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatMessage, setChatMessage] = React.useState('');

  React.useEffect(() => {
    if (chatOpen && currentTrip?.id) {
      loadChatHistory(currentTrip.id);
    }
  }, [chatOpen, currentTrip?.id, loadChatHistory]);

  const getStatusButton = () => {
    if (!currentTrip) return null;
    
    switch (currentTrip.status) {
      case 'ACCEPTED':
      case 'DRIVER_ASSIGNED':
        return {
          label: 'Start Driving (En Route)',
          action: () => driverUpdateTripStatus('EN_ROUTE'),
          color: 'bg-primary hover:bg-primary-hover text-white shadow-primary/20'
        };
      case 'DRIVER_ARRIVING':
        return {
          label: 'Arrived at Pickup Location',
          action: () => driverUpdateTripStatus('ARRIVED'),
          color: 'bg-success hover:bg-success-dark text-white shadow-success/20'
        };
      case 'RIDER_PICKED':
        return {
          label: 'Start the Ride',
          action: () => driverUpdateTripStatus('START'),
          color: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
        };
      case 'IN_PROGRESS':
        return {
          label: 'Complete the Ride',
          action: () => driverUpdateTripStatus('COMPLETE'),
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
        };
      default:
        return null;
    }
  };

  const statusBtn = getStatusButton();

  React.useEffect(() => {
    loadDriverProfile();

    // Poll driver profile status if it's pending approval
    let intervalId;
    if (driverDocs.status === 'PENDING') {
      intervalId = setInterval(() => {
        loadDriverProfile();
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadDriverProfile, driverDocs.status]);

  const stats = [
    { label: "Today's Earnings", val: `₹${driverEarnings.today.toFixed(2)}`, icon: <IndianRupee className="w-5 h-5 text-primary" />, desc: `Week total: ₹${driverEarnings.week.toFixed(2)}` },
    { label: "Completed Trips", val: `${driverEarnings.trips} Trips`, icon: <CheckCircle className="w-5 h-5 text-success" />, desc: "High rating average" },
    { label: "Acceptance Rate", val: `${driverEarnings.acceptanceRate}%`, icon: <Clock className="w-5 h-5 text-secondary" />, desc: "Excellent response" },
    { label: "Safety Rating", val: `★ ${driverEarnings.safetyRating}`, icon: <ShieldCheck className="w-5 h-5 text-accent" />, desc: "Verified score status" }
  ];

  return (
    <div className="flex-1 bg-surface p-6 max-w-6xl mx-auto w-full min-h-[calc(100vh-68px)] relative">
      
      {/* INCOMING RIDE REQUEST OVERLAY MODAL */}
      <AnimatePresence>
        {incomingRideRequest && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-3xl p-6 border border-brandBorder shadow-2xl max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent animate-pulse" />
              
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Incoming Ride Request</span>
              </div>

              {/* Rider quick stats */}
              <div className="flex items-center gap-3.5 bg-slate-50 border border-brandBorder rounded-2xl p-4 mb-4">
                <div className="w-11 h-11 bg-primary-light text-primary rounded-xl flex items-center justify-center font-display font-bold text-lg">
                  {incomingRideRequest.riderName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{incomingRideRequest.riderName}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <span className="flex items-center text-amber-500 gap-0.5">
                      <Star className="w-3 h-3 fill-current" /> {incomingRideRequest.riderRating}
                    </span>
                    <span>•</span>
                    <span className="text-primary">Verified Rider</span>
                  </div>
                </div>
              </div>

              {/* Route information */}
              <div className="text-xs font-semibold space-y-2 mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Pickup</span>
                    {incomingRideRequest.pickup}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Destination</span>
                    {incomingRideRequest.destination}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimated Payout</span>
                  <span className="text-2xl font-display font-extrabold text-primary">{incomingRideRequest.fare}</span>
                </div>
                <Badge variant="primary" className="py-1 px-3 text-[10px] font-bold">
                  {incomingRideRequest.eta} away
                </Badge>
              </div>

              {/* Accept / Reject actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={driverRejectTrip}
                  className="py-3 bg-slate-100 text-brandText font-bold rounded-2xl hover:bg-slate-200 transition"
                >
                  Decline
                </button>
                <button
                  onClick={driverAcceptTrip}
                  className="py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/25 transition"
                >
                  Accept & Navigate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header and Online Switch */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brandText">Driver Command Center</h1>
          <p className="text-xs text-brandText-muted font-medium">Manage your online dispatch, document approvals, and safety status.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/driver/verification')}
            className="px-4 py-2.5 bg-white border border-brandBorder text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-50 transition shadow-sm"
          >
            Documents
          </button>
          
          <button
            onClick={toggleDriverOnline}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition shadow-md ${
              driverOnline 
                ? 'bg-success text-white hover:bg-success-dark' 
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            <Radio className={`w-4 h-4 ${driverOnline ? 'animate-pulse' : ''}`} />
            {driverOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* Quick offline/pending verification warning */}
      {driverDocs.status === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-3xl mb-8 flex items-start gap-3 font-semibold">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Account Verification Pending</div>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Your credentials are under review by system administrators. You can go online once verified.</p>
          </div>
        </div>
      )}

      {(driverDocs.status === 'NONE' || driverDocs.status === 'REJECTED') && (
        <div className="bg-danger/10 border border-danger/25 text-danger-dark text-xs p-4 rounded-3xl mb-8 flex items-start gap-3 font-semibold">
          <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Verification Documents Required</div>
            <p className="text-[11px] text-slate-600 mt-0.5">Please upload your selfie, ID, and license details to register and verify your profile.</p>
            <button 
              onClick={() => navigate('/driver/verification')}
              className="mt-2.5 text-[10px] bg-primary hover:bg-primary-hover text-white font-extrabold px-3.5 py-1.5 rounded-xl transition uppercase tracking-wider"
            >
              Go to Verification Center
            </button>
          </div>
        </div>
      )}

      {driverDocs.status === 'APPROVED' && !driverOnline && !currentTrip && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-3xl mb-8 flex items-start gap-3 font-semibold">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">You are currently offline</div>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Toggle status to Online to receive ride requests.</p>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="bg-white border border-brandBorder shadow-card p-3.5 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider truncate mr-1">{stat.label}</span>
              <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                {stat.icon}
              </div>
            </div>
            <div className="text-lg font-display font-extrabold text-slate-800 truncate">{stat.val}</div>
            <span className="text-[8px] text-brandText-light font-bold block mt-1 truncate">{stat.desc}</span>
          </Card>
        ))}
      </div>

      {/* Main active ride monitoring dashboard */}
      <div className="flex flex-col gap-6">
        
        {/* Left pane: Active ride or Simulator helper */}
        <div className="space-y-6">
          {currentTrip ? (
            <Card className="bg-white border-2 border-primary/20 shadow-lg p-6">
              <CardHeader className="pb-3 border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="primary" className="mb-2">
                      Active Trip: {currentTrip.status}
                    </Badge>
                    <CardTitle className="text-lg font-bold">Ride Progress: {currentTrip.progress}%</CardTitle>
                  </div>
                  <span className="text-sm font-extrabold text-primary">{currentTrip.fare}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Route list */}
                <div className="bg-slate-50 border border-brandBorder rounded-2xl p-4 text-xs font-semibold space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Pickup</span>
                      {currentTrip.pickup}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Destination</span>
                      {currentTrip.destination}
                    </div>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${currentTrip.progress}%` }} />
                </div>

                {statusBtn && (
                  <button
                    onClick={statusBtn.action}
                    className={`w-full py-3 ${statusBtn.color} font-extrabold text-[11px] rounded-2xl transition shadow-md uppercase tracking-wider`}
                  >
                    {statusBtn.label}
                  </button>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => navigate('/driver/safety')}
                    className="py-2.5 bg-danger-light text-danger font-bold text-[10px] rounded-xl hover:bg-danger/10 border border-danger/15 transition flex flex-col items-center justify-center gap-1"
                  >
                    <ShieldAlert className="w-4 h-4 text-danger" />
                    <span className="truncate">SOS/Safety</span>
                  </button>

                  <button
                    onClick={() => setChatOpen(true)}
                    className="py-2.5 bg-white border border-brandBorder hover:bg-slate-50 text-slate-500 rounded-xl transition flex flex-col items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] font-bold">Chat</span>
                  </button>
                  
                  <button
                    onClick={() => alert('Opening navigation console...')}
                    className="py-2.5 bg-primary text-white font-bold text-[10px] rounded-xl hover:bg-primary-hover transition flex flex-col items-center justify-center gap-1"
                  >
                    <Navigation className="w-4 h-4 text-white" />
                    <span>Navigate</span>
                  </button>
                </div>

                {currentTrip.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={async () => {
                      const ok = window.confirm("Are you sure you want to cancel this trip?");
                      if (ok) {
                        await cancelRide("Driver cancelled the ride");
                      }
                    }}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold rounded-xl text-[10px] transition uppercase tracking-wider mt-2.5"
                  >
                    Cancel Ride
                  </button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white border border-brandBorder rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center">
              <CheckCircle className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-sm font-bold text-slate-700">Ready for Trips</h3>
              <p className="text-xs text-brandText-muted mt-1 max-w-xs">You will see incoming ride requests here when you are online.</p>
            </div>
          )}
        </div>

        {/* Right pane: Earnings details */}
        <Card className="bg-white border border-brandBorder shadow-card p-6 h-fit">
          <CardHeader className="pb-3 border-b-0 mb-2">
            <CardTitle className="text-sm font-bold">Today's Activity Log</CardTitle>
            <CardDescription>Records of your driving shifts today.</CardDescription>
          </CardHeader>
          <CardContent>
            {driverEarnings.trips === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">
                No trips completed today. Take your first ride!
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: driverEarnings.trips }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Completed Ride #{100 + i}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block">Payout cleared safely</span>
                    </div>
                    <span className="text-xs font-extrabold text-success-dark">+₹{(driverEarnings.today / driverEarnings.trips).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* RIDER CHAT DIALOG OVERLAY */}
      <AnimatePresence>
        {chatOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end p-0">
            <motion.div 
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="bg-white rounded-t-[32px] w-full max-w-sm mx-auto flex flex-col h-[400px] shadow-2xl p-5 border-t border-brandBorder/60 pointer-events-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-brandBorder mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse shrink-0" />
                  <h3 className="text-xs font-bold text-slate-800">Chatting with {currentTrip?.riderName || 'Rider'}</h3>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Close</button>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[11px] font-semibold">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender?.toUpperCase() === 'DRIVER' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2.5 rounded-2xl max-w-[80%] ${
                      msg.sender?.toUpperCase() === 'DRIVER' ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatMessage.trim() || !currentTrip?.id) return;
                  sendChatMessage(currentTrip.id, chatMessage);
                  setChatMessage('');
                }} 
                className="mt-4 flex gap-2 border-t border-slate-100 pt-3"
              >
                <input
                  type="text"
                  placeholder="Type message to rider..."
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

    </div>
  );
}
