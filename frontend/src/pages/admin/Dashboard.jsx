import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { 
  Users, 
  Car, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  MapPin, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { allDrivers, allUsers, adminSosAlerts, allTrips, incidentReports, loadAdminData } = useHerRideStore();

  React.useEffect(() => {
    loadAdminData();
    // Poll admin data every 10 seconds for real-time telemetry
    const interval = setInterval(loadAdminData, 10000);
    return () => clearInterval(interval);
  }, [loadAdminData]);

  const activeSosCount = (adminSosAlerts || []).filter(a => a.status === 'ACTIVE').length;
  const pendingDriversCount = (allDrivers || []).filter(d => d.isVerified === 'PENDING').length;

  // Calculate dynamic weekly chart data from database
  const chartData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataMap = {};
    
    // Initialize days
    days.forEach(day => {
      dataMap[day] = { name: day, Rides: 0, Alerts: 0 };
    });

    // Populate actual trips counts
    if (Array.isArray(allTrips)) {
      allTrips.forEach(trip => {
        if (trip.createdAt) {
          const date = new Date(trip.createdAt);
          const dayName = days[date.getDay()];
          if (dataMap[dayName]) {
            dataMap[dayName].Rides += 1;
          }
        }
      });
    }

    // Populate actual alerts counts
    if (Array.isArray(adminSosAlerts)) {
      adminSosAlerts.forEach(alert => {
        if (alert.createdAt) {
          const date = new Date(alert.createdAt);
          const dayName = days[date.getDay()];
          if (dataMap[dayName]) {
            dataMap[dayName].Alerts += 1;
          }
        }
      });
    }

    // Return ordered Monday to Sunday
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => dataMap[day]);
  }, [allTrips, adminSosAlerts]);

  const statCards = [
    { label: "Active Passengers", count: allUsers.length, icon: <Users className="w-5 h-5 text-primary" />, desc: "Total registered riders" },
    { label: "Active Drivers", count: allDrivers.length, icon: <Car className="w-5 h-5 text-secondary" />, desc: `${allDrivers.filter(d => d.isVerified === 'APPROVED').length} verified & active` },
    { label: "Active SOS Alerts", count: activeSosCount, icon: <AlertTriangle className="w-5 h-5 text-danger" />, desc: "High priority alarms", highlight: activeSosCount > 0 },
    { label: "Pending Approvals", count: pendingDriversCount, icon: <CheckCircle className="w-5 h-5 text-success" />, desc: "Drivers awaiting review" }
  ];

  return (
    <div className="flex-1 bg-surface p-6 max-w-6xl mx-auto w-full min-h-[calc(100vh-68px)]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brandText">System Monitor</h1>
          <p className="text-xs text-brandText-muted font-medium">Real-time system telemetry, safety incident logs, and database metrics.</p>
        </div>
      </div>

      {/* SOS Alert Banner */}
      {activeSosCount > 0 && (
        <div 
          onClick={() => navigate('/admin/alerts')}
          className="bg-danger border border-danger/20 text-white text-xs p-5 rounded-3xl mb-8 flex items-center justify-between font-semibold cursor-pointer hover:bg-danger-dark transition-colors shadow-lg shadow-danger/25"
        >
          <div className="flex items-center gap-3.5">
            <ShieldAlert className="w-5 h-5 text-white shrink-0 animate-bounce" />
            <div>
              <div className="font-bold text-sm">ACTIVE SOS ALARM DETECTED</div>
              <p className="text-red-100 text-[11px] mt-0.5">There are active emergency alarms requiring review and resolution.</p>
            </div>
          </div>
          <span className="text-[10px] bg-white text-danger font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Review Alerts
          </span>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <Card key={idx} className={`bg-white border p-5 shadow-card ${stat.highlight ? 'border-danger/30 bg-red-50/10' : 'border-brandBorder'}`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                {stat.icon}
              </div>
            </div>
            <div className="text-2xl font-display font-extrabold text-slate-800">{stat.count}</div>
            <span className="text-[9px] text-brandText-light font-bold block mt-1">{stat.desc}</span>
          </Card>
        ))}
      </div>

      {/* Recharts Analytics graphs */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2 bg-white border border-brandBorder shadow-card p-6 min-w-0">
          <CardHeader className="pb-3 border-b-0 mb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" /> Daily Completed Rides
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="99%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRides" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6D28D9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6D28D9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Rides" stroke="#6D28D9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRides)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SOS Incident distribution bar */}
        <Card className="md:col-span-1 bg-white border border-brandBorder shadow-card p-6 min-w-0">
          <CardHeader className="pb-3 border-b-0 mb-4">
            <CardTitle className="text-sm font-bold">SOS Alarms Scraped</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="99%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="Alerts" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom split: Pending driver approvals & Incident reports */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Pending approvals teaser */}
        <Card className="bg-white border border-brandBorder shadow-card p-6">
          <CardHeader className="pb-3 border-b-0 mb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Pending Driver Verifications</CardTitle>
              <span className="text-[10px] text-slate-400 font-semibold block">Awaiting credential review</span>
            </div>
            <button 
              onClick={() => navigate('/admin/drivers')}
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
            >
              Verify Queue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>
          <CardContent>
            {pendingDriversCount === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                No drivers pending verification. Good job!
              </div>
            ) : (
              <div className="space-y-3">
                {allDrivers.filter(d => d.isVerified === 'PENDING').map((drv) => (
                  <div key={drv.id} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{drv.name}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block">{drv.car} • {drv.licensePlate}</span>
                    </div>
                    <Badge variant="primary">Awaiting</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incident Reports teaser */}
        <Card className="bg-white border border-brandBorder shadow-card p-6">
          <CardHeader className="pb-3 border-b-0 mb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Active Incident Log</CardTitle>
              <span className="text-[10px] text-slate-400 font-semibold block">Passenger & vehicle reports</span>
            </div>
            <button 
              onClick={() => navigate('/admin/reports')}
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
            >
              View Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>
          <CardContent>
            {incidentReports.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                No active incident reports. Safety checks normal.
              </div>
            ) : (
              <div className="space-y-3">
                {incidentReports.slice(0, 3).map((rep) => (
                  <div key={rep.id} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{rep.category}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block">By {rep.user} against {rep.driver}</span>
                    </div>
                    <Badge variant={rep.status === 'RESOLVED' ? 'success' : 'danger'}>{rep.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
