import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Shield, UserPlus, Trash2, Heart, Users, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TrustedContacts() {
  const navigate = useNavigate();
  const { trustedContacts, addTrustedContact, deleteTrustedContact, loadTrustedContacts } = useHerRideStore();

  useEffect(() => {
    loadTrustedContacts();
  }, []);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    addTrustedContact(data);
    reset();
    setShowAddForm(false);
  };

  const getRelationshipColor = (rel) => {
    switch (rel) {
      case 'Mother': return 'bg-primary-light text-primary-dark border-primary/20';
      case 'Sister': return 'bg-secondary-light text-secondary-dark border-secondary/20';
      case 'Friend': return 'bg-accent-light text-accent-dark border-accent/20';
      case 'Emergency Contact': return 'bg-danger-light text-danger-dark border-danger/20';
      default: return 'bg-slate-100 text-slate-705 border-slate-200';
    }
  };

  return (
    <div className="flex-1 bg-surface p-6 max-w-2xl mx-auto w-full min-h-[calc(100vh-68px)]">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/home')}
            className="p-2.5 bg-white hover:bg-slate-50 border border-brandBorder rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-extrabold text-brandText">Trusted Contacts</h1>
            <p className="text-xs text-brandText-muted font-medium">Manage who receives emergency alerts and live route coordinates.</p>
          </div>
        </div>
        
        {!showAddForm && (
          <Button 
            onClick={() => setShowAddForm(true)}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Add Contact
          </Button>
        )}
      </div>

      {/* Add Contact Form Dialog */}
      {showAddForm && (
        <Card className="mb-6 bg-white border border-brandBorder shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserPlus className="w-4.5 h-4.5 text-primary" />
              Add New Trusted Contact
            </CardTitle>
            <CardDescription>Emergency alerts will be SMS-dispatched to this number.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex flex-col gap-4">
                <Input
                  label="Name"
                  id="name"
                  placeholder="e.g. Sneha Sharma"
                  error={errors.name?.message}
                  {...register('name', { required: 'Name is required' })}
                />
                
                <Input
                  label="Phone Number"
                  id="phone"
                  placeholder="e.g. +91 98765 43210"
                  error={errors.phone?.message}
                  {...register('phone', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^\+?[1-9]\d{1,14}$/,
                      message: 'Please enter a valid phone number (e.g. +919876543210)'
                    }
                  })}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-brandText-muted">Relationship</label>
                <div className="flex flex-wrap gap-2">
                  {['Mother', 'Sister', 'Friend', 'Guardian', 'Emergency Contact'].map((rel) => (
                    <label
                      key={rel}
                      className="flex items-center justify-center px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-brandBorder rounded-xl text-xs font-bold cursor-pointer transition"
                    >
                      <input
                        type="radio"
                        value={rel}
                        {...register('relationship', { required: 'Select relationship' })}
                        className="mr-1.5 accent-primary"
                        defaultChecked={rel === 'Mother'}
                      />
                      {rel}
                    </label>
                  ))}
                </div>
                {errors.relationship && (
                  <span className="text-[11px] font-semibold text-danger">{errors.relationship.message}</span>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-100 text-brandText text-xs font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <Button type="submit" size="sm">
                  Save Contact
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Contacts List Grid */}
      <div className="space-y-4">
        {trustedContacts.length === 0 ? (
          <div className="bg-white border border-brandBorder rounded-3xl p-12 text-center shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-700">No Trusted Contacts</h3>
            <p className="text-xs text-brandText-muted mt-1 max-w-xs mx-auto">Add family or friends so they can monitor your route and receive safety alerts.</p>
          </div>
        ) : (
          trustedContacts.map((contact) => (
            <div 
              key={contact.id} 
              className="bg-white border border-brandBorder rounded-3xl p-5 shadow-card flex items-center justify-between transition hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-slate-50 border border-brandBorder rounded-2xl flex items-center justify-center text-slate-500">
                  <Heart className="w-5 h-5 text-primary fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{contact.name}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${getRelationshipColor(contact.relationship)}`}>
                      {contact.relationship}
                    </span>
                  </div>
                  <span className="text-xs text-brandText-muted font-medium mt-0.5 block">{contact.phone}</span>
                </div>
              </div>

              <button
                onClick={() => deleteTrustedContact(contact.id)}
                className="p-2.5 bg-slate-50 hover:bg-danger-light text-slate-400 hover:text-danger rounded-xl border border-brandBorder/60 hover:border-danger/20 transition"
                title="Delete Contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Information Banner */}
      <div className="mt-8 bg-primary-light/10 border border-primary/15 rounded-3xl p-5 flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-800">Automatic Telemetry SMS Protocol</h4>
          <p className="text-[11px] text-brandText-muted leading-relaxed font-medium">
            Whenever you book a ride or activate SOS, HerRide's Termii SMS service automatically dispatches a message containing your name, coordinates, and vehicle details directly to this list.
          </p>
        </div>
      </div>

    </div>
  );
}
