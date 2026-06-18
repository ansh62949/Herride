import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { 
  ArrowLeft, 
  Lock, 
  Languages, 
  FileText, 
  Mail, 
  Trash2, 
  ChevronRight,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const navigate = useNavigate();
  
  // Sub-Panels: 'MENU', 'PASSWORD', 'LANGUAGE', 'POLICY', 'CONTACT', 'DELETE'
  const [panel, setPanel] = useState('MENU');
  
  const [successMsg, setSuccessMsg] = useState('');

  // Password fields
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Contact fields
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Language setting
  const [currentLang, setCurrentLang] = useState('English');
  const languages = [
    { name: 'English', flag: '🇺🇸' },
    { name: 'Bangla', flag: '🇧🇩' },
    { name: 'Spanish', flag: '🇪🇸' },
    { name: 'French', flag: '🇫🇷' }
  ];

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      alert("New passwords do not match!");
      return;
    }
    setSuccessMsg('Password changed successfully!');
    setOldPass(''); setNewPass(''); setConfirmPass('');
    setTimeout(() => { setSuccessMsg(''); setPanel('MENU'); }, 1500);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('Feedback submitted successfully!');
    setContactEmail(''); setContactMessage('');
    setTimeout(() => { setSuccessMsg(''); setPanel('MENU'); }, 1500);
  };

  const handleDeleteAccount = () => {
    if (window.confirm("CRITICAL: Are you absolutely sure you want to permanently delete your HerRide credentials? This action is irreversible.")) {
      alert("Account deleted.");
      useHerRideStore.getState().logout();
      navigate('/');
    }
  };

  return (
    <div className="flex-1 bg-surface p-5 flex flex-col justify-between overflow-y-auto min-h-[calc(100vh-68px)]">
      
      <AnimatePresence mode="wait">
        
        {/* PANEL: MAIN SETTINGS MENU (Figma Screen 52) */}
        {panel === 'MENU' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
              <button onClick={() => navigate('/home')} className="p-2 border border-brandBorder rounded-xl text-slate-500 hover:bg-slate-50 transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-display font-bold text-slate-800">Settings</h2>
            </div>

            {/* List options */}
            <div className="space-y-2.5">
              {[
                { id: 'PASSWORD', title: 'Change Password', desc: 'Secure your login pass', icon: <Lock className="w-4.5 h-4.5 text-primary" /> },
                { id: 'LANGUAGE', title: 'Language Selector', desc: `Selected: ${currentLang}`, icon: <Languages className="w-4.5 h-4.5 text-secondary" /> },
                { id: 'POLICY', title: 'Privacy Policy', desc: 'Read terms & data shields', icon: <FileText className="w-4.5 h-4.5 text-accent" /> },
                { id: 'CONTACT', title: 'Contact Support', desc: 'Send notes directly to desk', icon: <Mail className="w-4.5 h-4.5 text-success" /> },
                { id: 'DELETE', title: 'Delete Account', desc: 'Irreversible deletion', icon: <Trash2 className="w-4.5 h-4.5 text-danger" /> }
              ].map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => setPanel(opt.id)}
                  className="p-4 bg-white border border-brandBorder rounded-3xl hover:border-slate-300 shadow-card cursor-pointer transition flex justify-between items-center text-xs font-semibold"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                      {opt.icon}
                    </div>
                    <div>
                      <span className="text-slate-800 block">{opt.title}</span>
                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{opt.desc}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* PANEL: CHANGE PASSWORD (Figma Screen 53) */}
        {panel === 'PASSWORD' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
              <button onClick={() => setPanel('MENU')} className="p-2 border border-brandBorder rounded-xl text-slate-500 transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-display font-bold text-slate-800">Change Password</h2>
            </div>

            {successMsg ? (
              <div className="bg-success-light border border-success/20 text-success-dark text-xs p-4 rounded-2xl flex items-center gap-2 font-bold">
                <Check className="w-4 h-4" /> {successMsg}
              </div>
            ) : (
              <Card className="bg-white border border-brandBorder p-5">
                <form onSubmit={handlePasswordSave} className="space-y-4">
                  <Input 
                    label="Old Password"
                    id="oldP"
                    type="password"
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    placeholder="Enter old password"
                    required
                  />

                  <Input 
                    label="New Password"
                    id="newP"
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />

                  <Input 
                    label="Confirm Password"
                    id="confP"
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />

                  <Button type="submit" className="w-full py-3">
                    Save Changes
                  </Button>
                </form>
              </Card>
            )}
          </motion.div>
        )}

        {/* PANEL: LANGUAGE PICKER (Figma Screen 54) */}
        {panel === 'LANGUAGE' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
              <button onClick={() => setPanel('MENU')} className="p-2 border border-brandBorder rounded-xl text-slate-500 transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-display font-bold text-slate-800">Language Selector</h2>
            </div>

            <div className="space-y-2.5">
              {languages.map((lang) => {
                const isSelected = currentLang === lang.name;
                return (
                  <div
                    key={lang.name}
                    onClick={() => { setCurrentLang(lang.name); setPanel('MENU'); }}
                    className={`p-4 bg-white border rounded-3xl cursor-pointer transition flex justify-between items-center text-xs font-bold ${
                      isSelected ? 'border-primary ring-1 ring-primary/25 bg-primary-light/5' : 'border-brandBorder hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-slate-800">{lang.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* PANEL: PRIVACY POLICY (Figma Screen 55) */}
        {panel === 'POLICY' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
              <button onClick={() => setPanel('MENU')} className="p-2 border border-brandBorder rounded-xl text-slate-500 transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-display font-bold text-slate-800">Privacy Policy</h2>
            </div>

            <Card className="bg-white border border-brandBorder p-5 h-80 overflow-y-auto text-[11px] text-brandText-muted leading-relaxed font-medium space-y-4">
              <h4 className="font-bold text-slate-800 text-xs">1. Data Telemetry Encryption</h4>
              <p>HerRide dispatches all active rider coordinates via STOMP WebSockets encryption. Location checks are stored for verification logs only and destroyed automatically.</p>
              
              <h4 className="font-bold text-slate-800 text-xs">2. SMS Alert Routing</h4>
              <p>By syncing trusted contacts, you approve the Termii gateway dispatching location details directly to targets during active panics or checkin timeouts.</p>

              <h4 className="font-bold text-slate-800 text-xs">3. Driver background checks</h4>
              <p>Biometric face-scans and National database checks verify each female driver's compliance before registration is approved by administrators.</p>
            </Card>
          </motion.div>
        )}

        {/* PANEL: CONTACT US (Figma Screen 56) */}
        {panel === 'CONTACT' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
              <button onClick={() => setPanel('MENU')} className="p-2 border border-brandBorder rounded-xl text-slate-500 transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-display font-bold text-slate-800">Contact Us</h2>
            </div>

            {successMsg ? (
              <div className="bg-success-light border border-success/20 text-success-dark text-xs p-4 rounded-2xl flex items-center gap-2 font-bold">
                <Check className="w-4 h-4" /> {successMsg}
              </div>
            ) : (
              <Card className="bg-white border border-brandBorder p-5">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <Input 
                    label="Email Address"
                    id="contactE"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />

                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-semibold text-brandText-muted">Message / Question</label>
                    <textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Write your message here..."
                      className="w-full p-3 bg-slate-50 border border-brandBorder rounded-xl text-xs font-semibold outline-none resize-none h-28 focus:bg-white focus:border-primary transition"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full py-3">
                    Send Message
                  </Button>
                </form>
              </Card>
            )}
          </motion.div>
        )}

        {/* PANEL: DELETE ACCOUNT (Figma Screen 57) */}
        {panel === 'DELETE' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6 flex-grow flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
                <button onClick={() => setPanel('MENU')} className="p-2 border border-brandBorder rounded-xl text-slate-500 transition">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-display font-bold text-slate-800 text-danger">Delete Account</h2>
              </div>

              <Card className="bg-red-50/20 border border-danger/20 p-5 text-center space-y-4">
                <div className="w-12 h-12 bg-danger-light text-danger rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Are you sure?</h3>
                <p className="text-[10px] text-brandText-muted leading-relaxed font-semibold">
                  Deleting your account will permanently scrub your ride histories, safety ratings, and verified credentials from the HerRide cluster database.
                </p>
              </Card>
            </div>

            <Button 
              onClick={handleDeleteAccount}
              variant="danger" 
              className="w-full py-3.5 mb-6"
            >
              Confirm Account Deletion
            </Button>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
