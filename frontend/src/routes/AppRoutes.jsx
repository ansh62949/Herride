import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Shell from '../components/layout/Shell';

// Pages
import Landing from '../pages/Landing/Landing';
import Auth from '../pages/Auth/Auth';
import Home from '../pages/Home/Home';
import SOS from '../pages/SOS/SOS';
import Complain from '../pages/SOS/Complain';
import Settings from '../pages/Settings/Settings';
import TrustedContacts from '../pages/TrustedContacts/TrustedContacts';
import History from '../pages/History/History';
import Profile from '../pages/Profile/Profile';

// Driver Pages
import DriverDashboard from '../pages/driver/DriverDashboard';
import Verification from '../pages/driver/Verification';
import DriverSafety from '../pages/driver/Safety';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import Drivers from '../pages/admin/Drivers';
import SOSAlerts from '../pages/admin/SOSAlerts';
import Reports from '../pages/admin/Reports';
import Rides from '../pages/admin/Rides';
import AdminRiders from '../pages/admin/Riders';

import PaymentSandbox from '../pages/Payment/PaymentSandbox';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Sandbox Checkout Simulation */}
      <Route path="/payment/sandbox" element={<PaymentSandbox />} />
      {/* Landing Page (Figma Onboarding Flow) */}
      <Route path="/" element={<Landing />} />
      
      {/* Auth Page (Figma Locations, Welcome, Signup, OTP, Login Flow) */}
      <Route path="/auth" element={<Auth />} />

      {/* Rider Protected Routes wrapped in Shell */}
      <Route path="/home" element={<Shell><Home /></Shell>} />
      <Route path="/sos" element={<Shell><SOS /></Shell>} />
      <Route path="/complain" element={<Shell><Complain /></Shell>} />
      <Route path="/settings" element={<Shell><Settings /></Shell>} />
      <Route path="/contacts" element={<Shell><TrustedContacts /></Shell>} />
      <Route path="/history" element={<Shell><History /></Shell>} />
      <Route path="/profile" element={<Shell><Profile /></Shell>} />

      {/* Driver Routes wrapped in Shell */}
      <Route path="/driver" element={<Shell><DriverDashboard /></Shell>} />
      <Route path="/driver/verification" element={<Shell><Verification /></Shell>} />
      <Route path="/driver/safety" element={<Shell><DriverSafety /></Shell>} />

      {/* Admin Routes wrapped in Shell */}
      <Route path="/admin" element={<Shell><AdminDashboard /></Shell>} />
      <Route path="/admin/drivers" element={<Shell><Drivers /></Shell>} />
      <Route path="/admin/alerts" element={<Shell><SOSAlerts /></Shell>} />
      <Route path="/admin/reports" element={<Shell><Reports /></Shell>} />
      <Route path="/admin/rides" element={<Shell><Rides /></Shell>} />
      <Route path="/admin/riders" element={<Shell><AdminRiders /></Shell>} />

      {/* Fallback to onboarding */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
