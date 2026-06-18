import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useHerRideStore } from '../../store/useHerRideStore';
import { 
  Shield, 
  MapPin, 
  ChevronDown, 
  Check, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Smartphone,
  AlertCircle,
  User,
  Mail,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, sendOtp, verifyOtp } = useHerRideStore();

  // Screen Stages: LOCATION, WELCOME, ENTER_PHONE, REGISTER_DETAILS, ENTER_OTP, LOGIN
  const [stage, setStage] = useState('LOCATION');
  
  useEffect(() => {
    const flow = searchParams.get('flow');
    if (flow === 'login') {
      setStage('LOGIN');
    } else if (flow === 'location') {
      setStage('LOCATION');
    }
  }, [searchParams]);

  // Form inputs
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [terms, setTerms] = useState(true);

  // Unregistered user details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('RIDER'); // RIDER or DRIVER
  const [gender, setGender] = useState('FEMALE'); // Restrict to Female

  // Admin login details
  const [adminEmail, setAdminEmail] = useState('admin@herride.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);

  // UI status states
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Digital Keypad input for OTP
  const handleKeypadPress = (num) => {
    setErrorMsg('');
    if (num === 'DEL') {
      setOtpCode(prev => prev.slice(0, -1));
    } else {
      if (otpCode.length < 5) {
        setOtpCode(prev => prev + num);
      }
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phone || phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const cleanPhone = `${countryCode}${phone}`.replace(/\s+/g, '');

    try {
      const data = await sendOtp(cleanPhone);
      setLoading(false);
      if (data) {
        setDevOtp(data.devOtp);
        setIsNewUser(!data.registered);
        
        // Auto fill for frictionless testing
        setOtpCode(data.devOtp);

        if (!data.registered) {
          // Send to registration details screen
          setStage('REGISTER_DETAILS');
        } else {
          // Send straight to OTP verification
          setStage('ENTER_OTP');
          setSuccessMsg('Verification code dispatched!');
          setTimeout(() => setSuccessMsg(''), 2000);
        }
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Failed to send verification code. Please try again.');
    }
  };

  const handleRegistrationDetailsSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Please fill in all registration fields.');
      return;
    }
    if (gender !== 'FEMALE') {
      setErrorMsg('Safety Rule: Only female passengers and verified female drivers can register on HerRide.');
      return;
    }
    if (!terms) {
      setErrorMsg('You must agree to the Safety Protocols & Terms of Service.');
      return;
    }

    setStage('ENTER_OTP');
    setSuccessMsg('Registration initialized. Verify OTP.');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    if (otpCode.length < 5) {
      setErrorMsg('Please enter the 5-digit verification code.');
      return;
    }

    setLoading(true);
    const cleanPhone = `${countryCode}${phone}`.replace(/\s+/g, '');
    
    // Split name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Passenger';

    const regDetails = isNewUser ? {
      firstName,
      lastName,
      email,
      role,
      gender
    } : {};

    try {
      const success = await verifyOtp(cleanPhone, otpCode, regDetails);
      setLoading(false);
      if (success) {
        setSuccessMsg('Verification successful!');
        setTimeout(() => {
          setSuccessMsg('');
          const activeUserObj = useHerRideStore.getState().user;
          if (activeUserObj.role === 'ADMIN') navigate('/admin');
          else if (activeUserObj.role === 'DRIVER') navigate('/driver');
          else navigate('/home');
        }, 1000);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!adminEmail || !adminPassword) {
      setErrorMsg('Please enter your administrator credentials.');
      return;
    }
    if (adminEmail !== 'admin@herride.com') {
      setErrorMsg('Access Denied. Only designated system administrator can login here.');
      return;
    }

    setLoading(true);
    try {
      const success = await login(adminEmail, adminPassword, 'ADMIN');
      setLoading(false);
      if (success) {
        setSuccessMsg('Welcome System Administrator.');
        setTimeout(() => {
          setSuccessMsg('');
          navigate('/admin');
        }, 1000);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || 'Invalid administrator password.');
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col relative overflow-hidden">
      
      {/* Dynamic Alerts */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 z-50 bg-danger-light border border-danger/20 text-danger-dark text-xs p-4 rounded-2xl flex items-start gap-2 font-semibold shadow-lg"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-danger mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 z-50 bg-success-light border border-success/20 text-success-dark text-xs p-4 rounded-2xl flex items-center gap-2 font-semibold shadow-lg"
          >
            <Check className="w-4 h-4 text-success" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE 1: LOCATION PROMPT */}
      {stage === 'LOCATION' && (
        <div className="flex-1 flex flex-col justify-between p-6 bg-slate-50 relative">
          <div className="absolute inset-0 bg-slate-900 opacity-[0.03] grid grid-cols-6 grid-rows-8 gap-px pointer-events-none">
            {Array.from({ length: 48 }).map((_, i) => <div key={i} className="border border-slate-950/20" />)}
          </div>

          <div className="w-full flex items-center justify-between z-10">
            <div className="w-6 h-6" /> 
            <button 
              onClick={() => setStage('WELCOME')}
              className="text-xs font-bold text-slate-400 hover:text-primary transition"
            >
              Skip
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 z-10 px-4">
            <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center shadow-lg relative">
              <div className="w-6 h-6 bg-primary rounded-full animate-ping absolute" />
              <MapPin className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xl font-display font-bold text-slate-800">Enable Location</h2>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Activate your GPS to start matching with verified female drivers nearby.
              </p>
            </div>
          </div>

          <div className="z-10 pb-6">
            <Button 
              onClick={() => setStage('WELCOME')}
              className="w-full py-3.5"
            >
              Use My Location
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 2: WELCOME */}
      {stage === 'WELCOME' && (
        <div className="flex-1 flex flex-col justify-between p-6 relative">
          <div className="flex items-center justify-between py-2">
            <button onClick={() => setStage('LOCATION')} className="p-2 border border-brandBorder rounded-xl text-slate-500 hover:bg-slate-50 transition">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-primary tracking-wide">Welcome to HerRide</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-48 h-48 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
              <Smartphone className="w-24 h-24 text-primary animate-pulse" />
            </div>

            <div className="space-y-2 px-2">
              <h2 className="text-xl font-display font-bold text-slate-800">Women-Driven Mobility</h2>
              <p className="text-xs text-brandText-muted leading-relaxed font-medium">
                India's safety-first ride-hailing prototype built exclusively for female passengers and verified drivers.
              </p>
            </div>
          </div>

          <div className="space-y-4 pb-6">
            <button
              onClick={() => setStage('ENTER_PHONE')}
              className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all text-center text-xs"
            >
              Get Started
            </button>
            
            <div className="text-center">
              <button 
                onClick={() => { setStage('LOGIN'); setRole('ADMIN'); }}
                className="text-[10px] text-slate-400 hover:text-primary font-bold hover:underline"
              >
                System Administrator Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: ENTER PHONE NUMBER */}
      {stage === 'ENTER_PHONE' && (
        <div className="flex-1 flex flex-col p-6 justify-between bg-white">
          <div className="space-y-6">
            <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
              <button onClick={() => setStage('WELCOME')} className="p-2 border border-brandBorder rounded-xl text-slate-500 transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-display font-bold text-slate-800">Enter Phone Number</h2>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Verify your mobile</h3>
              <p className="text-xs text-slate-400 font-medium">We'll dispatch a 5-digit verification code to confirm your device.</p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="flex flex-col space-y-1.5 w-full relative">
                <label className="text-xs font-semibold text-brandText-muted">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCodeDropdown(!showCodeDropdown)}
                      className="h-11 px-3 bg-slate-50 border border-brandBorder rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-1"
                    >
                      <span>ðŸ‡®ðŸ‡³ {countryCode}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {showCodeDropdown && (
                      <div className="absolute top-12 left-0 bg-white border border-brandBorder rounded-xl shadow-lg z-20 w-28 text-xs font-bold overflow-hidden">
                        <button
                          type="button"
                          onClick={() => { setCountryCode('+91'); setShowCodeDropdown(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50"
                        >
                          ðŸ‡®ðŸ‡³ +91 (IN)
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-brandBorder rounded-2xl text-sm font-medium transition outline-none focus:border-primary focus:bg-white"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full py-3.5" disabled={loading}>
                {loading ? 'Dispatched...' : 'Send Verification Code'}
              </Button>
            </form>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed font-semibold">
            By continuing, you authorize HerRide to send an OTP message to this mobile number.
          </p>
        </div>
      )}

      {/* STAGE 4: REGISTER DETAILS */}
      {stage === 'REGISTER_DETAILS' && (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto justify-between bg-white">
          <div className="space-y-6">
            <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
              <button onClick={() => setStage('ENTER_PHONE')} className="p-2 border border-brandBorder rounded-xl text-slate-500 transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-display font-bold text-slate-800">Create Safety Account</h2>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-semibold">Unregistered Mobile: {countryCode} {phone}</p>
              <h3 className="text-base font-bold text-slate-800">Tell us about yourself</h3>
            </div>

            <form onSubmit={handleRegistrationDetailsSubmit} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-brandText-muted">I want to register as a</label>
                <div className="grid grid-cols-2 gap-2">
                  {['RIDER', 'DRIVER'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition ${
                        role === r 
                          ? 'bg-primary-light border-primary/40 text-primary-dark' 
                          : 'bg-white border-brandBorder text-slate-500'
                      }`}
                    >
                      {r === 'RIDER' ? 'Passenger' : 'Female Driver'}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Full Name"
                id="regName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Sharma"
                required
              />

              <Input
                label="Email Address"
                id="regEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@gmail.com"
                required
              />

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-brandText-muted">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-brandBorder rounded-2xl text-xs font-semibold outline-none"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male (Restricted for Safety)</option>
                </select>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                <input 
                  type="checkbox" 
                  checked={terms} 
                  onChange={(e) => setTerms(e.target.checked)} 
                  className="mt-0.5 accent-primary" 
                />
                <span className="text-[10px] text-brandText-muted leading-relaxed font-semibold">
                  I confirm I agree to the safety protocols, emergency tracking policies, and terms of service.
                </span>
              </label>

              <Button type="submit" className="w-full py-3.5">
                Continue to Verification
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* STAGE 5: ENTER OTP */}
      {stage === 'ENTER_OTP' && (
        <div className="flex-1 flex flex-col p-6 justify-between bg-white overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
              <button 
                onClick={() => setStage(isNewUser ? 'REGISTER_DETAILS' : 'ENTER_PHONE')} 
                className="p-2 border border-brandBorder rounded-xl text-slate-500 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-display font-bold text-slate-800">Verification Code</h2>
            </div>

            <div className="text-center space-y-2 py-4">
              <h3 className="text-base font-bold text-slate-800">Enter OTP</h3>
              <p className="text-[11px] text-slate-400 font-medium">We dispatched a 5-digit verification code to {countryCode} {phone}</p>
            </div>

            {/* OTP Code Boxes */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div 
                  key={idx} 
                  className={`w-11 h-12 border-2 rounded-xl flex items-center justify-center font-display font-extrabold text-lg transition-colors bg-slate-50
                    ${otpCode.length === idx ? 'border-primary ring-1 ring-primary/25' : 'border-brandBorder'}
                  `}
                >
                  {otpCode[idx] || ''}
                </div>
              ))}
            </div>

            {devOtp && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-center text-[10px] font-bold text-primary max-w-xs mx-auto">
                âš¡ Development Testing OTP: <span className="underline font-mono text-xs">{devOtp}</span>
              </div>
            )}

            <Button onClick={handleVerifyOtp} className="w-full py-3.5" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Log In'}
            </Button>
          </div>

          {/* Keypad */}
          <div className="bg-slate-50 border-t border-brandBorder/60 p-4 -mx-6 -mb-6 grid grid-cols-3 gap-y-3 gap-x-4 text-center shrink-0">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button 
                key={num} 
                type="button" 
                onClick={() => handleKeypadPress(num.toString())}
                className="py-2.5 bg-white border border-brandBorder/40 rounded-xl font-display font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
              >
                {num}
              </button>
            ))}
            <div className="py-2.5" />
            <button 
              type="button" 
              onClick={() => handleKeypadPress('0')}
              className="py-2.5 bg-white border border-brandBorder/40 rounded-xl font-display font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
            >
              0
            </button>
            <button 
              type="button" 
              onClick={() => handleKeypadPress('DEL')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-display font-bold text-xs flex items-center justify-center"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* STAGE 6: ADMIN PASSWORD LOGIN */}
      {stage === 'LOGIN' && (
        <div className="flex-1 flex flex-col p-6 justify-between overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
              <button onClick={() => setStage('WELCOME')} className="p-2 border border-brandBorder rounded-xl text-slate-500 transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-display font-bold text-slate-800">System Admin Sign In</h2>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <Input
                label="Administrator Email"
                id="loginEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@herride.com"
                iconBefore={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Administrator Password"
                id="loginPass"
                type={showPass ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢"
                iconBefore={<Lock className="w-4 h-4 text-slate-400" />}
                iconAfter={
                  <button type="button" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                }
                required
              />

              <Button type="submit" className="w-full py-3.5" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In as System Admin'}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

