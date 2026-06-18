import React from 'react';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { User, Shield, Phone, Mail, Award, CheckCircle, Clock, Heart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const { user, trustedContacts, tripHistory } = useHerRideStore();

  const safetyScoreBreakdown = [
    { title: "Safety Check-in Response", score: "100%", desc: "Immediate check-in response rate during rides." },
    { title: "Verification Checked", score: "Verified", desc: "Biometric and government database match checked." },
    { title: "Trusted Contacts Synced", score: `${trustedContacts.length} Synced`, desc: "Automated SMS route loops established." }
  ];

  return (
    <div className="flex-1 bg-surface p-6 max-w-4xl mx-auto w-full min-h-[calc(100vh-68px)]">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/home')}
          className="p-2.5 bg-white hover:bg-slate-50 border border-brandBorder rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brandText">Safety Profile</h1>
          <p className="text-xs text-brandText-muted font-medium">Monitor your account security rating, emergency data logs, and profiles.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Core Profile Card */}
        <Card className="bg-white border border-brandBorder shadow-sm flex flex-col items-center text-center p-6 h-fit">
          <div className="w-20 h-20 bg-primary-light text-primary rounded-full flex items-center justify-center font-display font-extrabold text-3xl border border-primary/20 shadow-inner mb-4">
            {user?.name.charAt(0)}
          </div>
          
          <h2 className="text-lg font-display font-bold text-slate-800">{user?.name}</h2>
          <Badge variant="primary" className="mt-1 px-2.5 py-0.5">
            Verified Passenger
          </Badge>

          <div className="w-full border-t border-brandBorder/40 my-6 pt-4 space-y-3.5 text-xs text-left">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-brandText-muted truncate font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-brandText-muted font-medium">{user?.phone}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-brandText-muted font-medium">Gender: {user?.gender}</span>
            </div>
          </div>

          <div className="w-full bg-slate-50 border border-brandBorder rounded-2xl p-4 text-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Safety Rating</span>
            <span className="text-3xl font-display font-extrabold text-primary block mt-1">★ {user?.safetyScore}</span>
            <span className="text-[9px] text-slate-400 font-semibold block mt-1">Based on check-in responses</span>
          </div>
        </Card>

        {/* Security metrics dashboard */}
        <div className="space-y-6">
          <Card className="bg-white border border-brandBorder shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-primary" />
                Community Trust Analytics
              </CardTitle>
              <CardDescription>How your safety rating is calculated by the HerRide trust engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {safetyScoreBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-start border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="pr-4 space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                    <p className="text-[10px] text-brandText-muted leading-relaxed font-medium">{item.desc}</p>
                  </div>
                  <Badge variant={item.score.includes('Verified') || item.score.includes('100%') ? 'success' : 'primary'} className="shrink-0">
                    {item.score}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-brandBorder rounded-3xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-success-light text-success rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Completed Trips</span>
                <span className="text-lg font-display font-bold text-slate-800">{tripHistory.filter(r => r.status === 'Completed').length} Rides</span>
              </div>
            </div>

            <div className="bg-white border border-brandBorder rounded-3xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-accent-light text-accent rounded-2xl flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Trusted Contacts</span>
                <span className="text-lg font-display font-bold text-slate-800">{trustedContacts.length} Linked</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
