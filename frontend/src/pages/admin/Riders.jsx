import React, { useState } from 'react';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Users, Trash2, Search, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Riders() {
  const navigate = useNavigate();
  const { allUsers, deleteRider, loadAdminData } = useHerRideStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  React.useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Filter riders based on search term (name, email, phone)
  const filteredRiders = React.useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return allUsers;
    return allUsers.filter(u => 
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.includes(term)
    );
  }, [allUsers, searchTerm]);

  const handleDelete = async (riderId) => {
    if (window.confirm("Are you absolutely sure you want to permanently delete this passenger's account? This will cascade-delete their entire history (trips, safety contacts, payments, checkins, alerts) and cannot be undone.")) {
      setDeletingId(riderId);
      const success = await deleteRider(riderId);
      setDeletingId(null);
      if (success) {
        alert("Passenger account deleted successfully.");
      } else {
        alert("Failed to delete passenger account. Check authorization or server logs.");
      }
    }
  };

  return (
    <div className="flex-1 bg-surface p-6 max-w-6xl mx-auto w-full min-h-[calc(100vh-68px)] font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/admin')}
          className="p-2.5 bg-white hover:bg-slate-50 border border-brandBorder rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brandText">Passenger Registry</h1>
          <p className="text-xs text-brandText-muted font-medium">View active passenger records and perform account deregistrations.</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Search bar card */}
        <Card className="bg-white border border-brandBorder shadow-card p-4">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search passengers by name, email, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-brandBorder rounded-xl text-xs font-semibold outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </Card>

        {/* Riders Table / List */}
        <Card className="bg-white border border-brandBorder shadow-card p-6 overflow-hidden">
          <CardHeader className="pb-3 border-b-0 mb-4 px-0">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> Active Passenger Accounts ({filteredRiders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {filteredRiders.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 font-semibold">
                No matching passenger accounts found in database registry.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                      <th className="pb-3 px-3">Passenger ID</th>
                      <th className="pb-3 px-3">Name / Gender</th>
                      <th className="pb-3 px-3">Contact Details</th>
                      <th className="pb-3 px-3 text-center">Total Trips</th>
                      <th className="pb-3 px-3 text-center">Total Spent</th>
                      <th className="pb-3 px-3 text-center">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRiders.map((rider) => (
                      <tr key={rider.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition last:border-0">
                        <td className="py-4 px-3 font-mono text-[10px] text-slate-400">#{rider.id}</td>
                        <td className="py-4 px-3">
                          <span className="font-bold text-slate-800 block">{rider.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{rider.gender || 'FEMALE'}</span>
                        </td>
                        <td className="py-4 px-3">
                          <span className="block text-slate-700">{rider.email}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{rider.phone}</span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="font-bold text-slate-800">{rider.totalRides || 0}</span>
                        </td>
                        <td className="py-4 px-3 text-center text-success font-extrabold">
                          ₹{(rider.totalSpent || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-3 text-center">
                          <Badge variant={rider.status === 'ACTIVE' ? 'success' : 'neutral'}>
                            {rider.status || 'ACTIVE'}
                          </Badge>
                        </td>
                        <td className="py-4 px-3 text-right">
                          <button
                            onClick={() => handleDelete(rider.id)}
                            disabled={deletingId === rider.id}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg transition-colors inline-flex items-center justify-center border border-red-100 disabled:opacity-50"
                            title="Delete Account Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
