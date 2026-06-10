import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [activeTabId, setActiveTabId] = useState('new');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeUpi, setStoreUpi] = useState('admin@upi');
  const [currentGoldRate, setCurrentGoldRate] = useState(0);
  
  // Payment Modal State
  const [showModal, setShowModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' or 'Cash'
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }

    // Fetch user details
    const { data: userData } = await supabase.from('custom_users').select('*').eq('id', userId).single();
    if (!userData) {
      localStorage.removeItem('userId');
      navigate('/login');
      return;
    }
    setUser(userData);

    // Fetch store UPI settings
    const { data: settings } = await supabase.from('store_settings').select('upi_id').eq('id', 1).single();
    if (settings) setStoreUpi(settings.upi_id);

    // Fetch gold rates for 22K
    const { data: ratesData } = await supabase.from('nd_rates').select('gold22k').eq('id', 1).single();
    if (ratesData) setCurrentGoldRate(ratesData.gold22k);

    // Fetch active schemes
    const { data: schemesData } = await supabase.from('harvest_schemes').select('*').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: true });

    if (schemesData && schemesData.length > 0) {
      setSchemes(schemesData);
      
      const schemeIds = schemesData.map(s => s.id);
      const { data: paymentsData } = await supabase.from('payments').select('*').in('scheme_id', schemeIds).order('month_number', { ascending: true });
      setPayments(paymentsData || []);

      if (activeTabId === 'new' && schemesData.length > 0) {
        setActiveTabId(schemesData[0].id);
      } else if (activeTabId !== 'new') {
        const stillExists = schemesData.find(s => s.id === activeTabId);
        if (!stillExists) setActiveTabId(schemesData[0].id);
      }
    } else {
      setSchemes([]);
      setActiveTabId('new');
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScheme = async (e) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    const { data, error } = await supabase.from('harvest_schemes').insert([{ user_id: user.id, monthly_amount: amount, status: 'active' }]).select().single();
    if (error) {
      alert('Error starting scheme: ' + error.message);
    } else {
      setActiveTabId(data.id);
      fetchData();
    }
  };

  const openPaymentModal = (monthNumber) => {
    setSelectedMonth(monthNumber);
    setPaymentMethod('UPI');
    setScreenshotFile(null);
    setPaymentSuccess(false);
    setShowModal(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    setUploading(true);

    const activeScheme = schemes.find(s => s.id === activeTabId);
    if (!activeScheme) return;

    let screenshot_url = null;

    if (paymentMethod === 'UPI') {
      if (!screenshotFile) {
        alert("Please upload a payment screenshot for UPI transactions.");
        setUploading(false);
        return;
      }
      
      const fileExt = screenshotFile.name.split('.').pop();
      const fileName = `${user.id}-${activeScheme.id}-${selectedMonth}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_screenshots')
        .upload(filePath, screenshotFile);

      if (uploadError) {
        alert("Error uploading screenshot: " + uploadError.message);
        setUploading(false);
        return;
      }

      // Get public URL
      const { data } = supabase.storage.from('payment_screenshots').getPublicUrl(filePath);
      screenshot_url = data.publicUrl;
    }

    const goldAmt = currentGoldRate > 0 ? parseFloat((activeScheme.monthly_amount / currentGoldRate).toFixed(4)) : 0;

    const existingPayment = payments.find(p => p.scheme_id === activeScheme.id && p.month_number === selectedMonth);
    let submitError;

    if (existingPayment && existingPayment.status === 'rejected') {
      const { error } = await supabase.from('payments').update({
        amount: activeScheme.monthly_amount,
        gold_rate: currentGoldRate,
        gold_amount: goldAmt,
        status: 'pending_approval',
        payment_method: paymentMethod,
        screenshot_url: screenshot_url || existingPayment.screenshot_url
      }).eq('id', existingPayment.id);
      submitError = error;
    } else {
      const { error } = await supabase.from('payments').insert([{ 
        scheme_id: activeScheme.id, 
        user_id: user.id, 
        month_number: selectedMonth, 
        amount: activeScheme.monthly_amount,
        gold_rate: currentGoldRate,
        gold_amount: goldAmt,
        status: 'pending_approval',
        payment_method: paymentMethod,
        screenshot_url: screenshot_url
      }]);
      submitError = error;
    }

    if (submitError) alert('Error submitting payment: ' + submitError.message);
    else {
      setPaymentSuccess(true);
      fetchData();
    }
    setUploading(false);
  };

  const activeScheme = schemes.find(s => s.id === activeTabId);
  const schemePayments = payments.filter(p => p.scheme_id === activeTabId);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--ivory-bg)', color: 'var(--royal-gold)' }}>Loading Dashboard...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory-bg)', color: 'var(--text-dark)', padding: '60px 20px', fontFamily: 'var(--font-sans)', overflowX: 'hidden', position: 'relative' }}>
      
      {/* Background Sunburst Pattern */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(184, 146, 58, 0.05) 0%, transparent 65%), repeating-conic-gradient(from 0deg, transparent 0deg 10deg, rgba(184, 146, 58, 0.01) 10deg 20deg)', pointerEvents: 'none', zIndex: 0 }}></div>

      <style>{`
        .ivory-card {
          background: var(--pristine-white);
          border: 1px solid var(--royal-gold-border);
          box-shadow: var(--box-shadow-luxury);
          border-radius: 12px;
          transition: var(--transition-smooth);
          position: relative;
          z-index: 1;
        }
        .luxury-hover:hover {
          transform: translateY(-5px);
          border-color: var(--royal-gold);
          box-shadow: 0 20px 40px rgba(42, 37, 32, 0.12);
        }
        .btn-luxury {
          background: var(--royal-gold);
          color: var(--pristine-white);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          border: none;
          transition: var(--transition-smooth);
          box-shadow: var(--box-shadow-gold);
        }
        .btn-luxury:hover {
          background: var(--royal-gold-hover);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(184, 146, 58, 0.3);
        }
        .btn-outline-luxury {
          background: transparent;
          color: var(--burgundy);
          border: 1.5px solid var(--burgundy);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          transition: var(--transition-smooth);
        }
        .btn-outline-luxury:hover {
          background: rgba(92, 22, 38, 0.05);
          transform: translateY(-2px);
        }
        @keyframes shimmerLight {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .bonus-card {
          position: relative;
          overflow: hidden;
          background: var(--royal-gold-light);
          border: 1px solid var(--royal-gold);
        }
        .bonus-card::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.8), transparent);
          transform: skewX(-20deg);
          animation: shimmerLight 4s infinite linear;
        }

        /* Hide scrollbar for tabs */
        .tabs-container::-webkit-scrollbar {
          height: 6px;
        }
        .tabs-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .tabs-container::-webkit-scrollbar-thumb {
          background: var(--royal-gold-border);
          border-radius: 10px;
        }
      `}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px', animation: 'fadeIn 0.8s ease-out' }}>
          <h1 style={{ fontSize: '3rem', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 10px 0', fontFamily: 'var(--font-serif)', color: 'var(--burgundy)' }}>
            Digital Gold Harvest
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', letterSpacing: '1px' }}>
            Welcome back, <span style={{ color: 'var(--text-dark)', fontWeight: 'bold' }}>{user?.full_name || 'Customer'}</span>
          </p>
        </div>

        {/* Dynamic Scheme Tabs */}
        {(schemes.length > 0 || activeTabId === 'new') && (
          <div className="tabs-container" style={{ display: 'flex', gap: '15px', overflowX: 'auto', marginBottom: '40px', paddingBottom: '15px', justifyContent: schemes.length > 0 ? 'flex-start' : 'center' }}>
            {schemes.map((s, index) => {
              const isActive = activeTabId === s.id;
              return (
                <button 
                  key={s.id}
                  onClick={() => setActiveTabId(s.id)}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '30px',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    border: `1.5px solid ${isActive ? 'var(--royal-gold)' : 'var(--royal-gold-border)'}`,
                    background: isActive ? 'var(--royal-gold)' : 'var(--pristine-white)',
                    color: isActive ? 'var(--pristine-white)' : 'var(--burgundy)',
                    boxShadow: isActive ? 'var(--box-shadow-gold)' : 'var(--box-shadow-luxury)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  A/C {index + 1} (₹{s.monthly_amount})
                </button>
              );
            })}
            <button 
              onClick={() => setActiveTabId('new')}
              style={{
                padding: '12px 28px',
                borderRadius: '30px',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: '1.5px dashed var(--royal-gold)',
                background: activeTabId === 'new' ? 'var(--royal-gold-light)' : 'transparent',
                color: 'var(--burgundy)',
                transition: 'var(--transition-smooth)'
              }}
            >
              + Start Another Scheme
            </button>
          </div>
        )}
        
        {activeTabId === 'new' ? (
          <div className="ivory-card" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out both' }}>
            <h3 style={{ color: 'var(--burgundy)', fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '15px' }}>Start a New Journey</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 40px', fontSize: '1.1rem', lineHeight: '1.6' }}>
              Invest securely for 11 months, and receive the <strong style={{ color: 'var(--royal-gold)' }}>12th month as a BONUS</strong> from ND Jewellers.
            </p>
            <form onSubmit={startScheme} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
              <div style={{ width: '100%', maxWidth: '350px' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '12px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Monthly EMI Amount (₹)</label>
                <input 
                  type="number" 
                  name="amount" 
                  min="1000" 
                  step="500" 
                  required 
                  style={{ padding: '18px', background: 'var(--ivory-cards)', border: '1.5px solid var(--royal-gold-border)', borderRadius: '8px', color: 'var(--text-dark)', outline: 'none', width: '100%', textAlign: 'center', fontSize: '1.5rem', fontFamily: 'var(--font-serif)' }} 
                />
              </div>
              <button type="submit" className="btn-luxury" style={{ padding: '18px 50px', borderRadius: '30px', fontSize: '1.1rem', width: '100%', maxWidth: '350px' }}>
                Start Plan Now
              </button>
            </form>
          </div>
        ) : activeScheme ? (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            
            {/* Top Dashboard Stats Card */}
            <div className="ivory-card" style={{ padding: '40px', marginBottom: '50px', position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(var(--royal-gold-light) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px', position: 'relative', zIndex: 2 }}>
                <div>
                  <h3 style={{ color: 'var(--burgundy)', fontFamily: 'var(--font-serif)', fontSize: '1.8rem', margin: '0 0 8px 0' }}>Active Harvest Scheme</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0, letterSpacing: '1px', fontSize: '0.9rem', fontWeight: 'bold' }}>STARTED: <span style={{ color: 'var(--text-dark)' }}>{new Date(activeScheme.start_date).toLocaleDateString()}</span></p>
                </div>
                <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 5px 0', fontWeight: 'bold' }}>Monthly Installment</p>
                    <p style={{ color: 'var(--text-dark)', fontSize: '2rem', fontWeight: 'bold', margin: 0, fontFamily: 'var(--font-serif)' }}>₹{activeScheme.monthly_amount}</p>
                  </div>
                  <div style={{ width: '1px', background: 'var(--royal-gold-border)' }}></div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 5px 0', fontWeight: 'bold' }}>Total Gold Secured</p>
                    <p style={{ color: 'var(--royal-gold)', fontSize: '2.5rem', fontWeight: 'bold', margin: 0, fontFamily: 'var(--font-serif)' }}>
                      {schemePayments.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.gold_amount || 0), 0).toFixed(4)}<span style={{ fontSize: '1.2rem' }}>g</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <h4 style={{ color: 'var(--burgundy)', marginBottom: '25px', fontSize: '1.4rem', fontFamily: 'var(--font-serif)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ width: '30px', height: '1.5px', background: 'var(--royal-gold)' }}></span>
              Payment Schedule
              <span style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--royal-gold-border), transparent)' }}></span>
            </h4>
            
            {/* Payment Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '25px' }}>
              {[...Array(11)].map((_, i) => {
                const monthNum = i + 1;
                const payment = schemePayments.find(p => p.month_number === monthNum);
                
                let isApproved = payment?.status === 'approved';
                let isPending = payment?.status === 'pending_approval';
                let isRejected = payment?.status === 'rejected';
                
                let cardStyle = "ivory-card luxury-hover";
                let borderColor = "var(--royal-gold-border)";
                let statusDotColor = "var(--royal-gold)";
                
                if (isApproved) {
                  borderColor = "#28a745";
                  statusDotColor = "#28a745";
                } else if (isPending) {
                  borderColor = "var(--royal-gold)";
                  statusDotColor = "var(--royal-gold)";
                } else if (isRejected) {
                  borderColor = "#dc3545";
                  statusDotColor = "#dc3545";
                }

                return (
                  <div key={monthNum} className={cardStyle} style={{ padding: '30px 25px', textAlign: 'center', position: 'relative', border: `1.5px solid ${borderColor}` }}>
                    
                    {/* Status Badge */}
                    {payment && (
                      <div style={{ position: 'absolute', top: '15px', right: '15px', width: '10px', height: '10px', borderRadius: '50%', background: statusDotColor, boxShadow: `0 0 8px ${statusDotColor}` }}></div>
                    )}

                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '10px', fontWeight: 'bold' }}>Month {monthNum}</div>
                    
                    {!payment || isRejected ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '15px' }}>
                        <div style={{ fontSize: '1.6rem', color: 'var(--text-dark)', fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>₹{activeScheme.monthly_amount}</div>
                        {isRejected && <div style={{ color: '#dc3545', fontSize: '0.8rem', fontWeight: 'bold' }}>Payment Failed</div>}
                        <button 
                          onClick={() => openPaymentModal(monthNum)}
                          className="btn-outline-luxury"
                          style={{ padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', width: '100%', fontSize: '0.85rem' }}>
                          Pay Now
                        </button>
                      </div>
                    ) : isPending ? (
                      <div style={{ marginTop: '20px' }}>
                        <div style={{ color: 'var(--royal-gold)', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>Processing</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verifying payment...</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '15px', fontWeight: 'bold' }}>{new Date(payment.payment_date).toLocaleDateString()}</div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '15px' }}>
                        <div style={{ color: '#28a745', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '5px' }}>✓ Secured</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px', fontWeight: 'bold' }}>{new Date(payment.payment_date).toLocaleDateString()}</div>
                        
                        {payment.gold_amount > 0 && (
                          <div style={{ background: 'var(--ivory-cards)', padding: '10px', borderRadius: '6px', border: '1px solid var(--royal-gold-light)' }}>
                            <div style={{ color: 'var(--burgundy)', fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>+{payment.gold_amount}g</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 'bold' }}>Rate: ₹{payment.gold_rate}/g</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* 12th Month Bonus - Spanning 2 columns if space allows */}
              <div className="ivory-card bonus-card luxury-hover" style={{ padding: '30px 25px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', gridColumn: '1 / -1' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '15px', fontWeight: 'bold' }}>Month 12</div>
                <div style={{ color: 'var(--royal-gold)', fontSize: '2.5rem', letterSpacing: '4px', marginBottom: '10px', fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>BONUS REWARD</div>
                <div style={{ fontSize: '1rem', color: 'var(--text-dark)', maxWidth: '500px', margin: '0 auto', fontWeight: '500' }}>Complete 11 installments to unlock your complimentary 12th month bonus directly from ND Jewellers.</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Payment Modal */}
      {showModal && activeScheme && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(42, 37, 32, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div className="ivory-card" style={{ padding: '40px', width: '100%', maxWidth: '500px', border: '1.5px solid var(--royal-gold)', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.8rem', transition: 'color 0.3s' }} onMouseOver={(e) => e.target.style.color = 'var(--burgundy)'} onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}>&times;</button>
            
            <div style={{ borderBottom: '1px solid var(--royal-gold-border)', paddingBottom: '20px', marginBottom: '25px', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--burgundy)', fontFamily: 'var(--font-serif)', fontSize: '1.8rem', margin: 0 }}>Complete Payment</h3>
            </div>
            
            {!paymentSuccess ? (
              <>
                <div style={{ background: 'var(--ivory-cards)', borderRadius: '8px', padding: '20px', marginBottom: '25px', textAlign: 'center', border: '1px solid var(--royal-gold-light)' }}>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 10px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Installment Month {selectedMonth}</p>
                  <div style={{ fontSize: '2.5rem', color: 'var(--text-dark)', fontFamily: 'var(--font-serif)', marginBottom: '15px', fontWeight: 'bold' }}>₹{activeScheme.monthly_amount}</div>
                  
                  {currentGoldRate > 0 && (
                    <div style={{ borderTop: '1px solid var(--royal-gold-border)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Live 22K Rate</div>
                        <div style={{ color: 'var(--royal-gold)', fontWeight: 'bold' }}>₹{currentGoldRate}/g</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Securing Approx.</div>
                        <div style={{ color: 'var(--burgundy)', fontWeight: 'bold', fontSize: '1.1rem' }}>{(activeScheme.monthly_amount / currentGoldRate).toFixed(4)}g</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <form onSubmit={submitPayment}>
                  <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Select Payment Method</label>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <label style={{ flex: 1, padding: '15px', border: `1.5px solid ${paymentMethod === 'UPI' ? 'var(--royal-gold)' : 'var(--royal-gold-border)'}`, background: paymentMethod === 'UPI' ? 'var(--royal-gold-light)' : 'var(--pristine-white)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', color: paymentMethod === 'UPI' ? 'var(--burgundy)' : 'var(--text-muted)', transition: 'all 0.3s', fontWeight: 'bold' }}>
                        <input type="radio" name="method" value="UPI" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} style={{ display: 'none' }} />
                        UPI / QR Code
                      </label>
                      <label style={{ flex: 1, padding: '15px', border: `1.5px solid ${paymentMethod === 'Cash' ? 'var(--royal-gold)' : 'var(--royal-gold-border)'}`, background: paymentMethod === 'Cash' ? 'var(--royal-gold-light)' : 'var(--pristine-white)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', color: paymentMethod === 'Cash' ? 'var(--burgundy)' : 'var(--text-muted)', transition: 'all 0.3s', fontWeight: 'bold' }}>
                        <input type="radio" name="method" value="Cash" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} style={{ display: 'none' }} />
                        Cash at Store
                      </label>
                    </div>
                  </div>

                  {paymentMethod === 'UPI' && (
                    <div style={{ background: 'var(--ivory-cards)', padding: '25px', borderRadius: '8px', border: '1px solid var(--royal-gold-light)', marginBottom: '25px', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-dark)', fontSize: '0.9rem', marginBottom: '20px', fontWeight: '500' }}>Scan the QR code to make your secure payment.</p>
                      
                      <div style={{ padding: '15px', background: '#fff', display: 'inline-block', borderRadius: '8px', boxShadow: 'var(--box-shadow-luxury)', marginBottom: '20px', border: '1px solid var(--royal-gold-border)' }}>
                        <img 
                          src={supabase.storage.from('payment_screenshots').getPublicUrl('admin_qr_code.png').data.publicUrl} 
                          alt="Store QR Code" 
                          style={{ width: '180px', height: '180px', objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>

                      <div style={{ fontSize: '1.1rem', color: 'var(--text-dark)', fontWeight: 'bold', marginBottom: '25px', letterSpacing: '1px' }}>
                        UPI ID: <span style={{ color: 'var(--burgundy)' }}>{storeUpi}</span>
                      </div>
                      
                      <div style={{ textAlign: 'left', borderTop: '1px solid var(--royal-gold-border)', paddingTop: '20px' }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>Upload Transaction Screenshot</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => setScreenshotFile(e.target.files[0])}
                          style={{ color: 'var(--text-dark)', width: '100%', padding: '10px', background: 'var(--pristine-white)', border: '1px dashed var(--royal-gold)', borderRadius: '4px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Cash' && (
                    <div style={{ background: 'var(--ivory-cards)', padding: '25px', borderRadius: '8px', border: '1px solid var(--royal-gold-light)', marginBottom: '25px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🏪</div>
                      <p style={{ color: 'var(--text-dark)', fontSize: '0.95rem', lineHeight: '1.5', fontWeight: '500' }}>Please visit the ND Jewellers store to deposit cash. Click submit below to notify the admin of your upcoming visit.</p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={uploading}
                    className="btn-luxury"
                    style={{ width: '100%', padding: '18px', borderRadius: '30px', cursor: uploading ? 'not-allowed' : 'pointer' }}>
                    {uploading ? 'Processing Securely...' : 'Confirm Payment'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(40,167,69,0.1)', color: '#28a745', fontSize: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', border: '2px solid #28a745' }}>
                  ✓
                </div>
                <h4 style={{ color: 'var(--burgundy)', fontSize: '1.5rem', marginBottom: '15px', fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>Payment Submitted</h4>
                <p style={{ color: 'var(--text-muted)', marginBottom: '40px', lineHeight: '1.5', fontWeight: '500' }}>Your request has been securely sent. It is currently pending admin verification.</p>
                
                <a 
                  href={`https://wa.me/910000000000?text=${encodeURIComponent(`Hello ND JEWELLERS! I have just paid my EMI of ₹${activeScheme.monthly_amount} for Month ${selectedMonth} (Scheme ID: ${activeScheme.id}). My registered phone number is ${user.phone_number}. Please approve my payment.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowModal(false)}
                  style={{ display: 'block', width: '100%', padding: '16px', background: '#25D366', color: '#fff', textDecoration: 'none', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '30px', marginBottom: '15px', letterSpacing: '1px', transition: 'all 0.3s', boxShadow: '0 8px 20px rgba(37, 211, 102, 0.2)' }}>
                  Notify Admin on WhatsApp
                </a>
                <button 
                  onClick={() => setShowModal(false)}
                  className="btn-outline-luxury"
                  style={{ width: '100%', padding: '16px', borderRadius: '30px', cursor: 'pointer' }}>
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
