import React from 'react';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Shield, AlertTriangle, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const navigate = useNavigate();
  const { incidentReports, resolveIncidentReport, loadAdminData } = useHerRideStore();

  React.useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  return (
    <div className="flex-1 bg-surface p-6 max-w-5xl mx-auto w-full min-h-[calc(100vh-68px)]">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/admin')}
          className="p-2.5 bg-white hover:bg-slate-50 border border-brandBorder rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brandText">Incident Report Center</h1>
          <p className="text-xs text-brandText-muted font-medium">Review and resolve passenger safety and driver behaviour incident logs.</p>
        </div>
      </div>

      {/* Incident Reports List Stack */}
      <div className="space-y-4">
        {incidentReports.length === 0 ? (
          <div className="bg-white border border-brandBorder rounded-3xl p-12 text-center shadow-sm">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-700">No Incidents Reported</h3>
            <p className="text-xs text-slate-400 mt-1">Passenger commutes are safe and clear.</p>
          </div>
        ) : (
          incidentReports.map((report) => (
            <div 
              key={report.id}
              className="bg-white border border-brandBorder rounded-3xl p-6 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={
                    report.category === 'HARASSMENT' || report.category === 'Unsafe Driving' ? 'danger' : 'neutral'
                  }>
                    {report.category}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-bold">Report ID: {report.id}</span>
                  <span className="text-[10px] text-slate-400 font-bold">•</span>
                  <span className="text-[10px] text-slate-400 font-bold">{report.date}</span>
                </div>
                
                <h4 className="text-sm font-bold text-slate-800">
                  Rider: <span className="text-slate-600">{report.user}</span> • Driver: <span className="text-slate-600">{report.driver}</span>
                </h4>
                
                <p className="text-xs text-brandText-muted font-semibold max-w-xl leading-relaxed">
                  {report.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Badge variant={report.status === 'RESOLVED' ? 'success' : 'danger'}>
                  {report.status}
                </Badge>
                
                {report.status !== 'RESOLVED' && (
                  <button
                    onClick={() => {
                      resolveIncidentReport(report.id);
                    }}
                    className="p-2 bg-slate-50 hover:bg-success-light text-slate-400 hover:text-success rounded-xl border border-brandBorder hover:border-success/20 transition"
                    title="Mark Resolved"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
