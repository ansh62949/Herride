import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { AlertTriangle, Check, ArrowLeft, History, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Complain() {
  const navigate = useNavigate();
  const { incidentReports, submitIncidentReport, loadIncidentReports } = useHerRideStore();
  const [category, setCategory] = useState('UNSAFE_DRIVING');
  const [desc, setDesc] = useState('');
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    loadIncidentReports();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!desc.trim()) return;
    submitIncidentReport({ category, description: desc });
    setDesc('');
    setSuccess(true);
  };

  return (
    <div className="flex-1 bg-surface p-5 flex flex-col justify-between overflow-y-auto min-h-[calc(100vh-68px)]">
      
      <AnimatePresence>
        {success ? (
          /* FIGMA SCREEN 49: COMPLAIN SUCCESS DIALOG */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-grow flex flex-col items-center justify-center text-center space-y-6 px-4"
          >
            <div className="w-16 h-16 bg-success-light text-success rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-display font-extrabold text-slate-800">Send Successful</h3>
              <p className="text-xs text-brandText-muted leading-relaxed font-semibold max-w-xs">
                Your report has been submitted. Our safety team is actively investigating the incident.
              </p>
            </div>
            <Button onClick={() => setSuccess(false)} className="w-full max-w-xs py-3 mt-4">
              Back to Reports
            </Button>
          </motion.div>
        ) : (
          /* FIGMA SCREEN 48: COMPLAIN FORM */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 flex-grow flex flex-col justify-between"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 py-2 border-b border-brandBorder/40">
                <button onClick={() => navigate('/home')} className="p-2 border border-brandBorder rounded-xl text-slate-500 hover:bg-slate-50 transition">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-base font-display font-bold text-slate-800">Complain Desk</h2>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Security Logs</span>
                </div>
              </div>

              {/* Form card */}
              <Card className="bg-white border border-brandBorder p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
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
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="Write your complain details here..."
                      className="w-full p-3 bg-slate-50 border border-brandBorder rounded-xl text-xs font-semibold outline-none resize-none h-28 focus:bg-white focus:border-primary transition"
                      required
                    />
                  </div>

                  <Button type="submit" variant="danger" className="w-full py-3">
                    Submit Complain
                  </Button>
                </form>
              </Card>

              {/* History Teaser list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> Recent Complaints ({incidentReports.length})
                </h4>
                
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {incidentReports.map((report) => (
                    <div key={report.id} className="p-3.5 bg-white border border-brandBorder rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{report.category}</span>
                          <span className="text-[8px] text-slate-400">{report.date}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate max-w-[180px]">{report.description}</p>
                      </div>
                      <Badge variant={report.status === 'RESOLVED' ? 'success' : 'danger'}>
                        {report.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-semibold text-center py-2">
              All complaints are logged and addressed by safety managers.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
