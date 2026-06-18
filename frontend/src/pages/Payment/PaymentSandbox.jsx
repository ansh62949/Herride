import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Coins, 
  QrCode,
  ArrowRight
} from 'lucide-react';

export default function PaymentSandbox() {
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('PENDING'); // PENDING, SUCCESS, FAILED
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, CARD, NETBANKING, CASH
  const [selectedUpiApp, setSelectedUpiApp] = useState('GPAY'); // GPAY, PHONEPE, PAYTM, BHIM
  const [upiId, setUpiId] = useState('');

  // Mock Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Mock Bank state
  const [selectedBank, setSelectedBank] = useState('SBI'); // SBI, HDFC, ICICI, AXIS

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference');
    if (ref) {
      setReference(ref);
    } else {
      setStatus('FAILED');
      setErrorMessage('Missing transaction reference parameter.');
    }
  }, []);

  const handleSimulatePayment = async (success) => {
    if (!reference) return;
    setLoading(true);
    setErrorMessage('');

    try {
      if (success) {
        // Hit backend verification endpoint
        const response = await api.get(`/payments/verify/${reference}`);
        if (response.data && response.data.success && response.data.data.status === 'PAID') {
          setStatus('SUCCESS');
          setTimeout(() => {
            window.close();
            // Fallback if window.close is blocked by browser security
            window.location.href = '/home';
          }, 3000);
        } else {
          setStatus('FAILED');
          setErrorMessage(response.data.message || 'Verification failed. Payment status is not PAID.');
        }
      } else {
        setStatus('FAILED');
        setErrorMessage('User cancelled or declined the transaction simulation.');
      }
    } catch (err) {
      console.error('Sandbox verification failed:', err);
      setStatus('FAILED');
      setErrorMessage(err.response?.data?.message || 'Network error verifying transaction with backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex items-center justify-center p-6 min-h-screen relative overflow-hidden font-sans">
      
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(109,40,217,0.15)_0%,transparent_60%)] pointer-events-none" />
      
      <Card className="w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl relative z-10 rounded-[32px] p-6 overflow-hidden">
        
        {/* Top brand header */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center font-display font-extrabold text-sm shadow-lg shadow-primary/20">
            H
          </div>
          <span className="font-display font-extrabold text-sm text-primary tracking-wider">HerRide Premium Checkout</span>
        </div>

        {status === 'PENDING' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-lg font-display font-extrabold text-white">Payment Gateway</h1>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                India Localized Checkout Portal (Simulated Sandboxed Gateway)
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-xs font-semibold space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant Name:</span>
                <span className="text-slate-300">HerRide Mobility Pvt Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Ref:</span>
                <span className="text-slate-300 font-mono text-[9px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Currency:</span>
                <span className="text-slate-300">₹ INR (Indian Rupee)</span>
              </div>
            </div>

            {/* Payment Method SelectorTabs */}
            <div className="grid grid-cols-4 gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-[10px] font-extrabold text-center">
              {[
                { id: 'UPI', label: 'UPI', icon: Smartphone },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'NET', label: 'NetBank', icon: Building2 },
                { id: 'CASH', label: 'Cash', icon: Coins }
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
                      active ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Payment Option Form Canvas */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 min-h-[160px] flex flex-col justify-between">
              
              {/* 1. UPI Interface */}
              {paymentMethod === 'UPI' && (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Select UPI Application</span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-extrabold">
                      {[
                        { id: 'GPAY', label: 'Google Pay' },
                        { id: 'PHONEPE', label: 'PhonePe' },
                        { id: 'PAYTM', label: 'Paytm' },
                        { id: 'BHIM', label: 'BHIM' }
                      ].map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setSelectedUpiApp(app.id)}
                          className={`py-2 border rounded-xl transition ${
                            selectedUpiApp === app.id ? 'border-primary bg-primary-light/5 text-primary' : 'border-slate-800 text-slate-400'
                          }`}
                        >
                          {app.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative mt-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@okhdfcbank"
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:border-primary font-medium"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 italic">Enter your UPI ID or click the simulate button below to authorize.</p>
                </div>
              )}

              {/* 2. CARD Interface */}
              {paymentMethod === 'CARD' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Credit / Debit Card (RuPay enabled)</span>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="4000 1234 5678 9010"
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:border-primary font-mono"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                      placeholder="MM/YY"
                      className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:border-primary text-center font-mono"
                    />
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="CVV"
                      className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:border-primary text-center font-mono"
                    />
                  </div>
                </div>
              )}

              {/* 3. NETBANKING Interface */}
              {paymentMethod === 'NET' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Popular Indian Banks</span>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
                    {[
                      { id: 'SBI', label: 'State Bank of India' },
                      { id: 'HDFC', label: 'HDFC Bank' },
                      { id: 'ICICI', label: 'ICICI Bank' },
                      { id: 'AXIS', label: 'Axis Bank' }
                    ].map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.id)}
                        className={`py-2 border rounded-xl transition ${
                          selectedBank === bank.id ? 'border-primary bg-primary-light/5 text-primary' : 'border-slate-800 text-slate-400'
                        }`}
                      >
                        {bank.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. CASH Interface */}
              {paymentMethod === 'CASH' && (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <Coins className="w-8 h-8 text-primary" />
                  <span className="text-xs font-extrabold text-slate-200">Pay cash directly to driver</span>
                  <p className="text-[9px] text-slate-500 max-w-xs font-medium">
                    Hand over the ride fare cash to your verified driver upon arrival. Click simulate below to confirm cash ledger sync.
                  </p>
                </div>
              )}

            </div>

            <div className="space-y-2.5">
              <Button
                variant="primary"
                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all"
                disabled={loading}
                onClick={() => handleSimulatePayment(true)}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Authorizing Ledger...
                  </>
                ) : (
                  paymentMethod === 'CASH' ? 'Confirm Cash Payment Ledger' : `Simulate Successful ${paymentMethod} Payment`
                )}
              </Button>

              <button
                className="w-full py-3 bg-slate-950 border border-slate-800 hover:bg-slate-900 hover:border-slate-700 text-slate-400 font-bold text-xs rounded-2xl transition"
                disabled={loading}
                onClick={() => handleSimulatePayment(false)}
              >
                Simulate Payment Failure / Cancel
              </button>
            </div>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-display font-extrabold text-white">Payment Authorized</h2>
            <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
              Sandbox payment verified successfully. The ledger has been synchronized. Returning you to the main app shortly.
            </p>
            <div className="text-[10px] text-slate-500 font-medium">
              Closing checkout tab...
            </div>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-display font-extrabold text-white">Payment Declined</h2>
            <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
              {errorMessage || 'Verification rejected. The transaction could not be processed.'}
            </p>
            
            <button
              onClick={() => {
                setStatus('PENDING');
                setErrorMessage('');
              }}
              className="mt-4 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition"
            >
              Try Again
            </button>
          </div>
        )}

      </Card>
    </div>
  );
}
