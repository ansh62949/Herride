import { create } from 'zustand';
import api from '../services/api';
import websocketService from '../services/websocket';

// Load initial states from LocalStorage for persistence
const initialUser = JSON.parse(localStorage.getItem('user') || 'null');
const initialToken = localStorage.getItem('token') || null;
const initialIsAuthenticated = !!initialToken;

export const useHerRideStore = create((set, get) => ({
  // --- Auth State ---
  isAuthenticated: initialIsAuthenticated,
  user: initialUser,
  token: initialToken,

  // --- Location & Booking Selection ---
  pickup: 'Connaught Place, New Delhi',
  destination: 'IGI Airport Terminal 3, New Delhi',
  selectedRideType: 'bike', // bike, auto, mini, sedan, suv
  rideTypes: [
    { id: 'bike', name: 'Bike', price: 'â‚¹120.00', eta: '2 mins', desc: 'Quick solo bike commutes' },
    { id: 'auto', name: 'Auto Rickshaw', price: 'â‚¹180.00', eta: '3 mins', desc: 'Spacious three-wheelers' },
    { id: 'mini', name: 'Mini (WagonR)', price: 'â‚¹240.00', eta: '4 mins', desc: 'Economy hatchback rides' },
    { id: 'sedan', name: 'Sedan (Swift Dzire)', price: 'â‚¹350.00', eta: '4 mins', desc: 'Premium comfort sedan' },
    { id: 'suv', name: 'SUV (Ertiga/Innova)', price: 'â‚¹550.00', eta: '5 mins', desc: 'Spacious family SUV' }
  ],
  nearbyDrivers: [],
  tripHistory: [],
  allDrivers: [],
  allUsers: [],
  adminSosAlerts: [],
  allTrips: [],

  // --- Current Active Trip ---
  currentTrip: null,
  chatHistory: [],

  // --- Safety & SOS ---
  trustedContacts: [],
  incidentReports: [],
  activeSosAlert: null,
  safetyCheckin: null, // { show: false, countdown: 10 }

  // --- Driver Telemetry & Docs ---
  driverOnline: false,
  driverEarnings: {
    today: 0,
    trips: 0,
    acceptanceRate: 100,
    safetyRating: 5.0,
    week: 0.00
  },
  driverDocs: {
    selfie: null,
    idCard: null,
    license: null,
    status: 'NONE' // NONE, PENDING, APPROVED
  },
  incomingRideRequest: null,

  // --- Core Auth Actions ---
  
  setRole: (role) => {
    set((state) => {
      if (role === 'ADMIN' && state.user?.email !== 'admin@herride.com') {
        return {};
      }
      const updated = { ...state.user, role };
      localStorage.setItem('user', JSON.stringify(updated));
      return { user: updated };
    });
  },

  setAuth: (isAuthenticated, userDetails) => {
    if (!isAuthenticated) {
      get().logout();
      return;
    }
    localStorage.setItem('user', JSON.stringify(userDetails));
    set({ isAuthenticated: true, user: userDetails });
    get().initWebSocket();
  },

  login: async (email, password, role) => {
    try {
      if (role === 'ADMIN' && email !== 'admin@herride.com') {
        throw new Error('Access denied. Only authorized administrators can log in with the ADMIN role.');
      }
      const response = await api.post('/auth/login', { email, password, role });
      if (response.data && response.data.success) {
        const authData = response.data.data;
        if (authData.role === 'ADMIN' && authData.email !== 'admin@herride.com') {
          throw new Error('Access denied. Only authorized administrators can access the ADMIN interface.');
        }
        
        localStorage.setItem('token', authData.accessToken);
        localStorage.setItem('refreshToken', authData.refreshToken);
        
        const userObj = {
          id: authData.userId,
          name: `${authData.firstName} ${authData.lastName}`,
          email: authData.email,
          phone: authData.phone,
          gender: authData.gender,
          role: (authData.email === 'admin@herride.com' && role === 'ADMIN') ? 'ADMIN' : authData.role
        };
        
        localStorage.setItem('user', JSON.stringify(userObj));
        set({ isAuthenticated: true, user: userObj, token: authData.accessToken });
        
        // Connect WebSockets
        get().initWebSocket();
        return true;
      }
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
    return false;
  },

  register: async (firstName, lastName, email, phone, password, role, gender) => {
    try {
      const response = await api.post('/auth/register', {
        firstName, lastName, email, phone, password, role, gender
      });
      if (response.data && response.data.success) {
        const authData = response.data.data;
        
        localStorage.setItem('token', authData.accessToken);
        localStorage.setItem('refreshToken', authData.refreshToken);
        
        const userObj = {
          id: authData.userId,
          name: `${authData.firstName} ${authData.lastName}`,
          email: authData.email,
          phone: authData.phone,
          gender: authData.gender,
          role: authData.role
        };
        
        localStorage.setItem('user', JSON.stringify(userObj));
        set({ isAuthenticated: true, user: userObj, token: authData.accessToken });
        
        // Connect WebSockets
        get().initWebSocket();
        return true;
      }
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
    return false;
  },

  sendOtp: async (phone) => {
    try {
      const response = await api.post('/auth/otp/send', { phone });
      if (response.data && response.data.success) {
        return response.data.data; // { registered, devOtp }
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      throw err;
    }
    return null;
  },

  verifyOtp: async (phone, otp, regDetails = {}) => {
    try {
      const payload = { phone, otp, ...regDetails };
      const response = await api.post('/auth/otp/verify', payload);
      if (response.data && response.data.success) {
        const authData = response.data.data;
        
        localStorage.setItem('token', authData.accessToken);
        localStorage.setItem('refreshToken', authData.refreshToken);
        
        const userObj = {
          id: authData.userId,
          name: `${authData.firstName} ${authData.lastName}`,
          email: authData.email,
          phone: authData.phone,
          gender: authData.gender,
          role: authData.role
        };
        
        localStorage.setItem('user', JSON.stringify(userObj));
        set({ isAuthenticated: true, user: userObj, token: authData.accessToken });
        
        get().initWebSocket();
        return true;
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      throw err;
    }
    return false;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout rejected or unreachable:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    websocketService.disconnect();
    get().stopDriverLocationPublishing();
    get().stopNearbyDriversPolling();
    
    set({ 
      isAuthenticated: false, 
      user: null, 
      token: null,
      currentTrip: null, 
      chatHistory: [],
      activeSosAlert: null,
      trustedContacts: [],
      safetyCheckin: null
    });
  },

  // --- Map & Booking Setup Actions ---

  setLocations: (pickup, destination) => {
    set({ pickup, destination });
    get().updateEstimates();
  },

  selectRideType: (id) => {
    set({ selectedRideType: id });
  },

  updateEstimates: async () => {
    const { pickup, destination } = get();
    if (!pickup || !destination) return;

    // Simulate coordinates based on destination strings
    const pickupLat = 28.6139;
    const pickupLng = 77.2090;
    const destLat = 28.5562;
    const destLng = 77.1000;

    try {
      const fetchEstimate = async (frontendType, backendType) => {
        try {
          const res = await api.get('/trips/estimate', {
            params: { pickupLat, pickupLng, destLat, destLng, vehicleType: backendType }
          });
          if (res.data && res.data.success) {
            return `â‚¹${res.data.data.estimatedFare.toFixed(2)}`;
          }
        } catch (e) {
          console.warn('Fare estimate unavailable for ' + backendType);
        }
        return null;
      };

      const bikePrice = await fetchEstimate('bike', 'BIKE');
      const autoPrice = await fetchEstimate('auto', 'TRICYCLE');
      const cabPrice = await fetchEstimate('cab', 'SEDAN');
      const shieldPrice = await fetchEstimate('shield', 'SUV');

      set((state) => ({
        rideTypes: state.rideTypes.map((t) => {
          if (t.id === 'bike' && bikePrice) return { ...t, price: bikePrice };
          if (t.id === 'auto' && autoPrice) return { ...t, price: autoPrice };
          if (t.id === 'cab' && cabPrice) return { ...t, price: cabPrice };
          if (t.id === 'shield' && shieldPrice) return { ...t, price: shieldPrice };
          return t;
        })
      }));
    } catch (err) {
      console.warn('Error fetching ride estimates:', err);
    }
  },

  // RIDER: Request Booking
  bookRide: async () => {
    const { pickup, destination, selectedRideType } = get();
    
    // Delhi Local Mock Coordinates
    const pickupLat = 28.6139 + (Math.random() - 0.5) * 0.01;
    const pickupLng = 77.2090 + (Math.random() - 0.5) * 0.01;
    const destLat = 28.5562 + (Math.random() - 0.5) * 0.01;
    const destLng = 77.1000 + (Math.random() - 0.5) * 0.01;

    let backendType = 'SEDAN';
    if (selectedRideType === 'bike') backendType = 'BIKE';
    else if (selectedRideType === 'auto') backendType = 'TRICYCLE';
    else if (selectedRideType === 'mini') backendType = 'VAN';
    else if (selectedRideType === 'sedan') backendType = 'SEDAN';
    else if (selectedRideType === 'suv') backendType = 'SUV';

    const payload = {
      pickupLatitude: pickupLat,
      pickupLongitude: pickupLng,
      pickupAddress: pickup,
      destinationLatitude: destLat,
      destinationLongitude: destLng,
      destinationAddress: destination,
      vehicleType: backendType,
      rideType: 'INSTANT'
    };

    try {
      const response = await api.post('/trips/request', payload);
      if (response.data && response.data.success) {
        get().handleTripUpdate(response.data.data);
        return true;
      }
    } catch (err) {
      console.error('Error booking ride:', err);
      if (err.response && err.response.status === 409) {
        get().loadTripHistory();
      }
    }
    return false;
  },

  cancelRide: async (reason = 'Changed my mind') => {
    const { currentTrip, user } = get();
    if (!currentTrip) return false;

    const backendReason = user?.role === 'DRIVER' ? 'DRIVER_CANCELLED' : 'RIDER_CANCELLED';

    try {
      const response = await api.post(`/trips/${currentTrip.id}/cancel`, { 
        reason: backendReason,
        note: reason 
      });
      if (response.data && response.data.success) {
        set({ currentTrip: null, safetyCheckin: null, activeSosAlert: null, chatHistory: [] });
        get().loadTripHistory();
        return true;
      }
    } catch (err) {
      console.error('Error cancelling ride:', err);
    }
    return false;
  },

  sendChatMessage: (tripId, text) => {
    const { user } = get();
    if (!user) return;
    const payload = {
      tripId,
      sender: user.role, // 'RIDER' or 'DRIVER'
      text,
      senderName: user.name || 'User',
      timestamp: new Date().toISOString()
    };
    websocketService.send('/app/chat.message', payload);
  },

  loadChatHistory: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/chat`);
      if (response.data && response.data.success) {
        set({ chatHistory: response.data.data });
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  },

  loadTripHistory: async () => {
    try {
      const response = await api.get('/trips/my-trips');
      if (response.data && response.data.success) {
        const rawTrips = response.data.data;
        const list = rawTrips.map(t => ({
          id: t.id,
          status: t.status,
          date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A',
          fare: t.actualFare ? `₹${t.actualFare.toFixed(2)}` : t.estimatedFare ? `₹${t.estimatedFare.toFixed(2)}` : 'N/A',
          pickup: t.pickupAddress,
          destination: t.destinationAddress,
          driver: t.driverName || 'No driver assigned',
          distance: t.distanceKm ? `${t.distanceKm.toFixed(1)} km` : ''
        }));
        set({ tripHistory: list });

        // Restore active trip if one exists in the database
        const activeTrip = rawTrips.find(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
        if (activeTrip) {
          get().handleTripUpdate(activeTrip);
        }
      }
    } catch (err) {
      console.error('Error loading trip history:', err);
    }
  },

  loadNearbyDrivers: async (lat = 28.6139, lng = 77.2090) => {
    try {
      const response = await api.get('/drivers/nearby', {
        params: { latitude: lat, longitude: lng, radiusKm: 10.0 }
      });
      if (response.data && response.data.success) {
        set({ nearbyDrivers: response.data.data });
      }
    } catch (err) {
      console.warn('Error loading nearby drivers:', err);
    }
  },

  stopNearbyDriversPolling: () => {
    if (window.nearbyDriversInterval) {
      clearInterval(window.nearbyDriversInterval);
      window.nearbyDriversInterval = null;
    }
  },

  // --- Trusted Contacts CRUD ---
  
  loadTrustedContacts: async () => {
    try {
      const response = await api.get('/safety/contacts');
      if (response.data && response.data.success) {
        const list = response.data.data.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          relationship: c.relationship
        }));
        set({ trustedContacts: list });
      }
    } catch (err) {
      console.error('Error loading safety contacts:', err);
    }
  },

  addTrustedContact: async (contact) => {
    try {
      const response = await api.post('/safety/contacts', contact);
      if (response.data && response.data.success) {
        get().loadTrustedContacts();
        return true;
      }
    } catch (err) {
      console.error('Error adding safety contact:', err);
    }
    return false;
  },

  deleteTrustedContact: async (id) => {
    try {
      const response = await api.delete(`/safety/contacts/${id}`);
      if (response.data && response.data.success) {
        get().loadTrustedContacts();
        return true;
      }
    } catch (err) {
      console.error('Error removing safety contact:', err);
    }
    return false;
  },

  // --- SOS Alert Operations ---
  
  triggerSos: async () => {
    const { currentTrip } = get();
    const lat = 28.6139;
    const lng = 77.2090;

    try {
      const response = await api.post('/safety/sos', {
        rideId: currentTrip ? currentTrip.id : null,
        latitude: lat,
        longitude: lng
      });

      if (response.data && response.data.success) {
        const sos = response.data.data;
        set({
          activeSosAlert: {
            id: sos.id,
            tripId: sos.rideId || 'N/A',
            user: get().user?.name || 'Rider',
            phone: get().user?.phone || '',
            location: 'Live GPS Coordinates',
            time: new Date().toLocaleTimeString(),
            status: 'ACTIVE',
            lat,
            lng
          }
        });
        return true;
      }
    } catch (err) {
      console.error('Error triggering SOS escalation:', err);
    }
    return false;
  },

  resolveSos: async (id) => {
    try {
      const response = await api.post(`/safety/sos/${id}/resolve`);
      if (response.data && response.data.success) {
        set({ activeSosAlert: null });
        get().loadAdminData();
        return true;
      }
    } catch (err) {
      console.error('Error resolving SOS:', err);
    }
    return false;
  },

  resolveIncidentReport: async (id) => {
    try {
      const response = await api.post(`/safety/incident/${id}/resolve`);
      if (response.data && response.data.success) {
        get().loadAdminData();
        return true;
      }
    } catch (err) {
      console.error('Error resolving incident report:', err);
    }
    return false;
  },

  loadAdminData: async () => {
    try {
      const driversRes = await api.get('/drivers').catch(() => null);
      const usersRes = await api.get('/users').catch(() => null);
      const sosRes = await api.get('/safety/sos/history').catch(() => null);
      const incidentsRes = await api.get('/safety/incident').catch(() => null);
      const tripsRes = await api.get('/trips').catch(() => null);

      const drivers = driversRes?.data?.success 
        ? driversRes.data.data.map(d => ({
            id: d.id,
            name: `${d.firstName} ${d.lastName}`,
            car: `${d.vehicleMake} ${d.vehicleModel}`,
            licensePlate: d.plateNumber,
            isVerified: d.verificationStatus === 'VERIFIED' ? 'APPROVED' : d.verificationStatus,
            earnings: d.totalEarnings || 0,
            status: d.driverStatus,
            rating: d.rating || 5.0
          }))
        : [];

      const users = usersRes?.data?.success 
        ? usersRes.data.data.map(u => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            phone: u.phone,
            gender: u.gender,
            status: u.status,
            totalRides: u.totalRides || 0,
            totalSpent: u.totalSpent || 0
          }))
        : [];

      const sosAlerts = sosRes?.data?.success 
        ? sosRes.data.data.map(s => ({
            id: s.id,
            tripId: s.rideId || 'N/A',
            user: s.riderName || 'Rider',
            phone: s.phone || '',
            location: `${s.latitude}, ${s.longitude}`,
            time: s.createdAt ? new Date(s.createdAt).toLocaleTimeString() : 'N/A',
            status: s.status,
            lat: s.latitude,
            lng: s.longitude
          }))
        : [];

      const incidentReports = incidentsRes?.data?.success 
        ? incidentsRes.data.data.map(i => ({
            id: i.id,
            category: i.category,
            description: i.description,
            status: i.status,
            date: i.createdAt ? new Date(i.createdAt).toLocaleDateString() : 'N/A',
            user: i.reporterName || 'Rider',
            driver: i.driverName || 'Driver'
          }))
        : [];

      const trips = tripsRes?.data?.success 
        ? tripsRes.data.data.map(t => ({
            id: t.id,
            riderName: t.riderName,
            driverName: t.driverName || 'Unassigned',
            pickup: t.pickupAddress,
            destination: t.destinationAddress,
            vehicleType: t.vehicleType,
            fare: `₹${(t.actualFare || t.estimatedFare || 0).toFixed(2)}`,
            driverEarnings: t.driverEarnings ? `₹${t.driverEarnings.toFixed(2)}` : '₹0.00',
            status: t.status,
            date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'
          }))
        : [];



      set({
        allDrivers: drivers,
        allUsers: users,
        adminSosAlerts: sosAlerts,
        incidentReports,
        allTrips: trips
      });
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  },

  adminVerifyDriver: async (driverId, status) => {
    try {
      const endpoint = status === 'APPROVED' ? '/drivers/approve' : '/drivers/reject';
      const response = await api.post(endpoint, null, { params: { driverId } });
      if (response.data && response.data.success) {
        get().loadAdminData();
        return true;
      }
    } catch (err) {
      console.error(`Error verifying driver ${driverId} to ${status}:`, err);
    }
    return false;
  },

  loadIncidentReports: async () => {
    try {
      const response = await api.get('/safety/incident');
      if (response.data && response.data.success) {
        const list = response.data.data.map(r => ({
          id: r.id,
          category: r.category,
          description: r.description,
          status: r.status,
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'
        }));
        set({ incidentReports: list });
      }
    } catch (err) {
      console.error('Error loading incident reports:', err);
    }
  },

  submitIncidentReport: async (report) => {
    const { currentTrip } = get();
    try {
      const response = await api.post('/safety/incident', {
        tripId: currentTrip ? currentTrip.id : null,
        category: report.category || 'OTHER',
        description: report.description
      });
      if (response.data && response.data.success) {
        get().loadIncidentReports();
        return true;
      }
    } catch (err) {
      console.error('Error submitting incident report:', err);
    }
    return false;
  },

  // --- Driver Actions ---

  loadDriverProfile: async () => {
    try {
      const response = await api.get('/drivers/profile');
      if (response.data && response.data.success) {
        const profile = response.data.data;
        set({ 
          driverOnline: profile.driverStatus === 'ONLINE',
          driverDocs: { 
            ...get().driverDocs, 
            status: profile.verificationStatus === 'VERIFIED' ? 'APPROVED' : profile.verificationStatus
          },
          driverEarnings: {
            today: profile.totalEarnings || 0.00,
            trips: profile.totalTrips || 0,
            acceptanceRate: profile.acceptanceRate || 95,
            safetyRating: profile.rating || 5.0,
            week: (profile.totalEarnings || 0.00) * 4.2
          }
        });
        
        if (profile.driverStatus === 'ONLINE') {
          get().startDriverLocationPublishing();
        }
      }
    } catch (err) {
      console.warn('Driver profile not set up yet:', err);
    }
  },

  createDriverProfile: async (docs) => {
    // Format payload matching DriverProfileRequest
    const payload = {
      vehicleType: docs.vehicleType || 'SEDAN',
      vehicleMake: docs.vehicleMake || 'Maruti Suzuki',
      vehicleModel: docs.vehicleModel || 'Swift Dzire',
      vehicleYear: docs.vehicleYear || '2024',
      plateNumber: docs.plateNumber || 'DL01AB1234',
      vehicleColor: docs.vehicleColor || 'Silver',
      licenseNumber: docs.licenseNumber || 'DL01-20241234567'
    };

    try {
      const response = await api.post('/drivers/profile', payload);
      if (response.data && response.data.success) {
        const p = response.data.data;
        set({ 
          driverDocs: { ...get().driverDocs, status: 'PENDING' },
          driverEarnings: {
            today: p.totalEarnings || 0.00,
            trips: p.totalTrips || 0,
            acceptanceRate: p.acceptanceRate || 95,
            safetyRating: p.rating || 5.0,
            week: (p.totalEarnings || 0.00) * 4.2
          }
        });
        return true;
      }
    } catch (err) {
      if (err.response?.status === 409) {
        console.warn('Driver profile already exists on backend, continuing.');
        set({ driverDocs: { ...get().driverDocs, status: 'PENDING' } });
        return true;
      }
      console.error('Driver profile setup failed:', err);
    }
    return false;
  },

  uploadDriverDocs: async (docs, vehicleDetails) => {
    // Local update
    set({
      driverDocs: {
        selfie: docs.selfie,
        idCard: docs.idCard,
        license: docs.license,
        status: 'PENDING'
      }
    });

    // Create backend profile with vehicle details passed from the user
    const success = await get().createDriverProfile({
      vehicleType: vehicleDetails.vehicleType || 'SEDAN',
      vehicleMake: vehicleDetails.vehicleMake || 'Maruti Suzuki',
      vehicleModel: vehicleDetails.vehicleModel || 'Swift Dzire',
      vehicleYear: vehicleDetails.vehicleYear || '2024',
      plateNumber: vehicleDetails.plateNumber || 'DL01AB1234',
      vehicleColor: vehicleDetails.vehicleColor || 'Silver',
      licenseNumber: vehicleDetails.licenseNumber || 'DL01-20241234567'
    });

    return success;
  },

  rateTrip: async (tripId, rating, review) => {
    try {
      const response = await api.post(`/trips/${tripId}/rate`, { rating, review });
      if (response.data && response.data.success) {
        set({ currentTrip: null, chatHistory: [] });
        get().loadTripHistory();
        return true;
      }
    } catch (err) {
      console.error('Error rating trip:', err);
    }
    return false;
  },

  initializePayment: async (tripId) => {
    try {
      const response = await api.post(`/payments/initialize/${tripId}`);
      if (response.data && response.data.success) {
        return response.data.data;
      }
    } catch (err) {
      console.error('Error initializing payment:', err);
    }
    return null;
  },

  verifyPayment: async (reference) => {
    try {
      const response = await api.get(`/payments/verify/${reference}`);
      if (response.data && response.data.success) {
        get().loadTripHistory();
        return response.data.data;
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
    }
    return null;
  },

  deleteRider: async (riderId) => {
    try {
      const response = await api.delete(`/users/${riderId}`);
      if (response.data && response.data.success) {
        get().loadAdminData();
        return true;
      }
    } catch (err) {
      console.error(`Error deleting rider ${riderId}:`, err);
    }
    return false;
  },

  clearCurrentTrip: () => {
    set({ currentTrip: null, chatHistory: [] });
  },

  toggleDriverOnline: async () => {
    const { driverOnline } = get();
    const nextStatus = driverOnline ? 'OFFLINE' : 'ONLINE';
    try {
      const response = await api.patch(`/drivers/status?status=${nextStatus}`);
      if (response.data && response.data.success) {
        set({ driverOnline: nextStatus === 'ONLINE' });
        
        if (nextStatus === 'ONLINE') {
          get().startDriverLocationPublishing();
        } else {
          get().stopDriverLocationPublishing();
        }
      }
    } catch (err) {
      console.error('Error toggling online state:', err);
    }
  },

  startDriverLocationPublishing: () => {
    if (window.driverLocInterval) clearInterval(window.driverLocInterval);

    window.driverLocInterval = setInterval(() => {
      const { driverOnline, currentTrip, user } = get();
      if (!driverOnline) {
        get().stopDriverLocationPublishing();
        return;
      }

      // Mock live coordinates around Delhi region
      const lat = 28.6139 + (Math.random() - 0.5) * 0.02;
      const lng = 77.2090 + (Math.random() - 0.5) * 0.02;

      // Update location via REST
      api.post('/drivers/location', { latitude: lat, longitude: lng })
        .catch(err => console.warn('CORS Location update queued:', err));

      // Broadcast location via WebSocket STOMP
      const payload = { latitude: lat, longitude: lng };
      if (currentTrip && currentTrip.status !== 'COMPLETED' && currentTrip.status !== 'CANCELLED') {
        payload.tripId = currentTrip.id;
        payload.riderId = currentTrip.riderId;
        payload.driverId = user?.id || currentTrip.driverId;
      }
      websocketService.send('/app/driver.location', payload);
    }, 8000);
  },

  stopDriverLocationPublishing: () => {
    if (window.driverLocInterval) {
      clearInterval(window.driverLocInterval);
      window.driverLocInterval = null;
    }
  },

  driverAcceptTrip: async () => {
    const { incomingRideRequest } = get();
    if (!incomingRideRequest) return;

    try {
      const response = await api.post(`/trips/${incomingRideRequest.id}/accept`);
      if (response.data && response.data.success) {
        set({ incomingRideRequest: null });
        get().handleTripUpdate(response.data.data);
      }
    } catch (err) {
      console.error('Error accepting trip:', err);
    }
  },

  driverRejectTrip: () => {
    set({ incomingRideRequest: null });
  },

  driverUpdateTripStatus: async (action) => {
    const { currentTrip } = get();
    if (!currentTrip) return;

    try {
      const response = await api.patch(`/trips/${currentTrip.id}/status?action=${action}`);
      if (response.data && response.data.success) {
        get().handleTripUpdate(response.data.data);
      }
    } catch (err) {
      console.error('Error updating trip status:', err);
    }
  },

  respondSafetyCheckin: async (safe) => {
    const { currentTrip } = get();
    if (!currentTrip) return;

    try {
      const response = await api.post('/safety/check-in/respond', null, {
        params: { tripId: currentTrip.id, safe }
      });
      if (response.data && response.data.success) {
        set({ safetyCheckin: null });
        if (!safe) {
          get().triggerSos();
        }
      }
    } catch (err) {
      console.error('Error responding to checkin:', err);
    }
  },

  // --- Real-time WebSocket Broker Logic ---

  initWebSocket: () => {
    const { isAuthenticated, user } = get();
    if (!isAuthenticated || !user) return;

    websocketService.connect(() => {
      // 1. Subscribe to client specific status changes
      websocketService.subscribe('/user/queue/trip-status', (payload) => {
        get().handleTripUpdate(payload);
      });

      // Admin real-time SOS subscription
      if (user.email === 'admin@herride.com') {
        websocketService.subscribe('/topic/admin/sos', (payload) => {
          if (!payload) return;
          const mappedAlert = {
            id: payload.id,
            tripId: payload.rideId || 'N/A',
            user: payload.riderName || 'Rider',
            phone: payload.phone || '',
            location: `${payload.latitude}, ${payload.longitude}`,
            time: payload.createdAt ? new Date(payload.createdAt).toLocaleTimeString() : 'N/A',
            status: payload.status,
            lat: payload.latitude,
            lng: payload.longitude
          };
          set(state => ({
            adminSosAlerts: [mappedAlert, ...state.adminSosAlerts.filter(a => a.id !== mappedAlert.id)]
          }));
        });
      }

      // 2. Subscribe to driver request queue
      if (user.role === 'DRIVER') {
        websocketService.subscribe('/user/queue/trip-request', (payload) => {
          if (!payload) return;
          const mappedRequest = {
            id: payload.id,
            riderName: payload.riderName || 'Rider',
            riderRating: payload.riderRating || 4.8,
            pickup: payload.pickupAddress,
            destination: payload.destinationAddress,
            fare: `â‚¹${(payload.actualFare || payload.estimatedFare || 0).toFixed(2)}`,
            eta: '3 mins'
          };
          set({ incomingRideRequest: mappedRequest });
        });
        
        get().loadDriverProfile();
      }

      // 3. Sync contacts & trip histories
      get().loadTrustedContacts();
      get().loadTripHistory();

      if (user.role === 'RIDER') {
        get().loadNearbyDrivers(28.6139, 77.2090);
        if (window.nearbyDriversInterval) clearInterval(window.nearbyDriversInterval);
        window.nearbyDriversInterval = setInterval(() => {
          const { currentTrip } = get();
          if (!currentTrip) {
            get().loadNearbyDrivers(28.6139, 77.2090);
          }
        }, 10000);
      }
    });
  },

  handleTripUpdate: (t) => {
    if (!t) return;

    const mappedTrip = {
      id: t.id,
      status: t.status,
      paymentStatus: t.paymentStatus,
      pickup: t.pickupAddress,
      destination: t.destinationAddress,
      pickupLat: t.pickupLatitude,
      pickupLng: t.pickupLongitude,
      destLat: t.destinationLatitude,
      destLng: t.destinationLongitude,
      rideType: t.vehicleType,
      vehicleType: t.vehicleType?.toLowerCase() === 'tricycle' ? 'auto' : t.vehicleType?.toLowerCase() === 'bike' ? 'bike' : t.vehicleType?.toLowerCase() === 'van' ? 'mini' : t.vehicleType?.toLowerCase() === 'suv' ? 'suv' : 'sedan',
      fare: `â‚¹${(t.actualFare || t.estimatedFare || t.fare || 0).toFixed(2)}`,
      driver: t.driverName ? {
        name: t.driverName,
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        rating: t.driverRating || 4.95,
        safetyScore: 5.0,
        car: t.vehicleModel || 'Swift Dzire',
        color: t.vehicleColor || 'White',
        plate: t.plateNumber || 'DL01AB1234',
        phone: t.driverPhone || ''
      } : null,
      eta: '3 mins',
      progress: t.status === 'DRIVER_ASSIGNED' ? 20 : t.status === 'DRIVER_ARRIVING' ? 40 : t.status === 'RIDER_PICKED' ? 60 : t.status === 'IN_PROGRESS' ? 80 : t.status === 'COMPLETED' ? 100 : 0,
      coordinates: t.driverLatitude ? { lat: t.driverLatitude, lng: t.driverLongitude } : { lat: t.pickupLatitude, lng: t.pickupLongitude }
    };

    set({ currentTrip: mappedTrip });

    // Handle completed / cancelled state cleanup
    const user = get().user;
    const isDriver = user?.role === 'DRIVER';
    if (t.status === 'CANCELLED' || (t.status === 'COMPLETED' && isDriver)) {
      setTimeout(() => {
        set((state) => {
          if (state.currentTrip?.id === t.id) {
            return { currentTrip: null, safetyCheckin: null, chatHistory: [] };
          }
          return {};
        });
        get().loadTripHistory();
      }, 3500);
    } else {
      // Connect chat channel for the active trip
      if (t.status !== 'CANCELLED' && t.status !== 'COMPLETED') {
        websocketService.subscribe(`/topic/trips/${t.id}/chat`, (payload) => {
          if (!payload) return;
          set((state) => {
            const exists = state.chatHistory.some(m => 
              m.timestamp === payload.timestamp && m.text === payload.text && m.sender === payload.sender
            );
            if (exists) return {};
            return { chatHistory: [...state.chatHistory, payload] };
          });
        });
      }
      // Connect location tracking stream if active Rider
      if (get().user?.role === 'RIDER' && t.driverLatitude) {
        websocketService.subscribe('/user/queue/driver-location', (loc) => {
          set((state) => {
            if (!state.currentTrip) return {};
            return {
              currentTrip: {
                ...state.currentTrip,
                coordinates: { lat: loc.latitude, lng: loc.longitude }
              }
            };
          });
        });
      }
    }
  }
}));

// Initialize websockets directly if token already stored
if (initialToken) {
  setTimeout(() => {
    useHerRideStore.getState().initWebSocket();
  }, 1000);
}

