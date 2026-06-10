import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [scheme, setScheme] = useState(null);
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

    // Fetch active scheme
    const { data: schemeData } = await supabase.from('harvest_schemes').select('*').eq('user_id', userId).eq('status', 'active').single();

    if (schemeData) {
      setScheme(schemeData);
      const { data: paymentsData } = await supabase.from('payments').select('*').eq('scheme_id', schemeData.id).order('month_number', { ascending: true });
      setPayments(paymentsData || []);
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
    const { error } = await supabase.from('harvest_schemes').insert([{ user_id: user.id, monthly_amount: amount, status: 'active' }]).select().single();
    if (error) alert('Error starting scheme: ' + error.message);
    else fetchData();
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

    let screenshot_url = null;

    if (paymentMethod === 'UPI') {
      if (!screenshotFile) {
        alert("Please upload a payment screenshot for UPI transactions.");
        setUploading(false);
        return;
      }
      
      const fileExt = screenshotFile.name.split('.').pop();
      const fileName = `${user.id}-${selectedMonth}-${Date.now()}.${fileExt}`;
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

    const goldAmt = currentGoldRate > 0 ? parseFloat((scheme.monthly_amount / currentGoldRate).toFixed(4)) : 0;

    const existingPayment = payments.find(p => p.month_number === selectedMonth);
    let submitError;

    if (existingPayment && existingPayment.status === 'rejected') {
      const { error } = await supabase.from('payments').update({
        amount: scheme.monthly_amount,
        gold_rate: currentGoldRate,
        gold_amount: goldAmt,
        status: 'pending_approval',
        payment_method: paymentMethod,
        screenshot_url: screenshot_url || existingPayment.screenshot_url
      }).eq('id', existingPayment.id);
      submitError = error;
    } else {
      const { error } = await supabase.from('payments').insert([{ 
        scheme_id: scheme.id, 
        user_id: user.id, 
        month_number: selectedMonth, 
        amount: scheme.monthly_amount,
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

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', color: 'var(--royal-gold)' }}>Loading Dashboard...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #1a1610 0%, #0a0a0a 100%)', color: '#fff', padding: '60px 20px', fontFamily: '"Inter", sans-serif', overflowX: 'hidden' }}>
      
      <style>{`
        .glass-card {
          background: rgba(26, 26, 26, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(184, 146, 58, 0.15);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .luxury-hover:hover {
          transform: translateY(-5px);
          border-color: rgba(184, 146, 58, 0.5);
          box-shadow: 0 15px 40px 0 rgba(184, 146, 58, 0.15);
        }
        .btn-luxury {
          background: linear-gradient(135deg, #b8923a, #cfab51, #b8923a);
          background-size: 200% auto;
          color: #000;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
          border: none;
          transition: 0.5s;
          box-shadow: 0 4px 15px rgba(184, 146, 58, 0.3);
        }
        .btn-luxury:hover {
          background-position: right center;
          transform: scale(1.02);
          box-shadow: 0 8px 25px rgba(184, 146, 58, 0.5);
        }
        .btn-outline-luxury {
          background: transparent;
          color: #b8923a;
          border: 1px solid #b8923a;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
        }
        .btn-outline-luxury:hover {
          background: rgba(184, 146, 58, 0.1);
          box-shadow: 0 0 15px rgba(184, 146, 58, 0.2);
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .bonus-card {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(184, 146, 58, 0.1), rgba(184, 146, 58, 0.02));
          border: 1px solid rgba(184, 146, 58, 0.4);
        }
        .bonus-card::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
          transform: skewX(-20deg);
          animation: shimmer 4s infinite linear;
        }
        .gold-text {
          background: linear-gradient(to right, #e6c875, #b8923a, #e6c875);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-family: "Playfair Display", serif;
        }
      `}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px', animation: 'fadeIn 0.8s ease-out' }}>
          <h1 className="gold-text" style={{ fontSize: '3rem', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
            Digital Gold Harvest
          </h1>
          <p style={{ color: '#aaa', fontSize: '1.1rem', letterSpacing: '1px' }}>
            Welcome back, <span style={{ color: '#fff', fontWeight: 'bold' }}>{user?.full_name || 'Customer'}</span>
          </p>
          <div style={{ width: '80px', height: '2px', background: 'linear-gradient(90deg, transparent, #b8923a, transparent)', margin: '25px auto 0' }} />
        </div>
        
        {!scheme ? (
          <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 1s ease-out 0.2s both' }}>
            <h3 style={{ color: '#b8923a', fontSize: '2rem', fontFamily: '"Playfair Display", serif', marginBottom: '15px' }}>Start Your Journey</h3>
            <p style={{ color: '#ccc', margin: '0 0 40px', fontSize: '1.1rem', lineHeight: '1.6' }}>
              Invest securely for 11 months, and receive the <strong style={{ color: '#b8923a' }}>12th month as a BONUS</strong> from ND Jewellers.
            </p>
            <form onSubmit={startScheme} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
              <div style={{ width: '100%', maxWidth: '350px' }}>
                <label style={{ display: 'block', color: '#888', marginBottom: '12px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Monthly EMI Amount (₹)</label>
                <input 
                  type="number" 
                  name="amount" 
                  min="1000" 
                  step="500" 
                  required 
                  style={{ padding: '18px', background: 'rgba(0,0,0,0.5)', border: '1px solid #b8923a', borderRadius: '8px', color: '#fff', outline: 'none', width: '100%', textAlign: 'center', fontSize: '1.5rem', fontFamily: '"Playfair Display", serif' }} 
                />
              </div>
              <button type="submit" className="btn-luxury" style={{ padding: '18px 50px', borderRadius: '30px', fontSize: '1.1rem', width: '100%', maxWidth: '350px' }}>
                Start Plan Now
              </button>
            </form>
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 1s ease-out' }}>
            
            {/* Top Dashboard Stats Card */}
            <div className="glass-card" style={{ padding: '40px', marginBottom: '50px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(184,146,58,0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px' }}>
                <div>
                  <h3 style={{ color: '#b8923a', fontFamily: '"Playfair Display", serif', fontSize: '1.8rem', margin: '0 0 8px 0' }}>Active Harvest Scheme</h3>
                  <p style={{ color: '#888', margin: 0, letterSpacing: '1px', fontSize: '0.9rem' }}>STARTED: <span style={{ color: '#ccc' }}>{new Date(scheme.start_date).toLocaleDateString()}</span></p>
                </div>
                <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 5px 0' }}>Monthly Installment</p>
                    <p style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold', margin: 0, fontFamily: '"Playfair Display", serif' }}>₹{scheme.monthly_amount}</p>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 5px 0' }}>Total Gold Secured</p>
                    <p className="gold-text" style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                      {payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.gold_amount || 0), 0).toFixed(4)}<span style={{ fontSize: '1.2rem' }}>g</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <h4 style={{ color: '#fff', marginBottom: '25px', fontSize: '1.4rem', fontFamily: '"Playfair Display", serif', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ width: '30px', height: '1px', background: '#b8923a' }}></span>
              Payment Schedule
              <span style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(184,146,58,0.5), transparent)' }}></span>
            </h4>
            
            {/* Payment Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '25px' }}>
              {[...Array(11)].map((_, i) => {
                const monthNum = i + 1;
                const payment = payments.find(p => p.month_number === monthNum);
                
                let isApproved = payment?.status === 'approved';
                let isPending = payment?.status === 'pending_approval';
                let isRejected = payment?.status === 'rejected';
                
                let cardStyle = "glass-card luxury-hover";
                let borderColor = "rgba(184, 146, 58, 0.15)";
                
                if (isApproved) {
                  borderColor = "rgba(40, 167, 69, 0.4)";
                } else if (isPending) {
                  borderColor = "rgba(184, 146, 58, 0.6)";
                } else if (isRejected) {
                  borderColor = "rgba(220, 53, 69, 0.4)";
                }

                return (
                  <div key={monthNum} className={cardStyle} style={{ padding: '30px 25px', textAlign: 'center', position: 'relative', border: `1px solid ${borderColor}` }}>
                    
                    {/* Status Badge */}
                    {payment && (
                      <div style={{ position: 'absolute', top: '15px', right: '15px', width: '10px', height: '10px', borderRadius: '50%', background: isApproved ? '#28a745' : isPending ? '#b8923a' : '#dc3545', boxShadow: `0 0 10px ${isApproved ? '#28a745' : isPending ? '#b8923a' : '#dc3545'}` }}></div>
                    )}

                    <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '10px' }}>Month {monthNum}</div>
                    
                    {!payment || isRejected ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '15px' }}>
                        <div style={{ fontSize: '1.6rem', color: '#fff', fontFamily: '"Playfair Display", serif' }}>₹{scheme.monthly_amount}</div>
                        {isRejected && <div style={{ color: '#dc3545', fontSize: '0.8rem', fontWeight: 'bold' }}>Payment Failed</div>}
                        <button 
                          onClick={() => openPaymentModal(monthNum)}
                          className="btn-outline-luxury"
                          style={{ padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', width: '100%', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Pay Now
                        </button>
                      </div>
                    ) : isPending ? (
                      <div style={{ marginTop: '20px' }}>
                        <div style={{ color: '#b8923a', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>Processing</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Verifying payment...</div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '15px' }}>{new Date(payment.payment_date).toLocaleDateString()}</div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '15px' }}>
                        <div style={{ color: '#28a745', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '5px' }}>✓ Secured</div>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>{new Date(payment.payment_date).toLocaleDateString()}</div>
                        
                        {payment.gold_amount > 0 && (
                          <div style={{ background: 'rgba(184,146,58,0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(184,146,58,0.2)' }}>
                            <div className="gold-text" style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>+{payment.gold_amount}g</div>
                            <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '4px' }}>Rate: ₹{payment.gold_rate}/g</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* 12th Month Bonus - Spanning 2 columns if space allows */}
              <div className="glass-card bonus-card luxury-hover" style={{ padding: '30px 25px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', gridColumn: '1 / -1' }}>
                <div style={{ color: '#b8923a', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '15px', fontWeight: 'bold' }}>Month 12</div>
                <div className="gold-text" style={{ fontSize: '2.5rem', letterSpacing: '4px', marginBottom: '10px' }}>BONUS REWARD</div>
                <div style={{ fontSize: '1rem', color: '#ccc', maxWidth: '500px', margin: '0 auto' }}>Complete 11 installments to unlock your complimentary 12th month bonus directly from ND Jewellers.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '500px', border: '1px solid #b8923a', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.8rem', transition: 'color 0.3s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#888'}>&times;</button>
            
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '25px', textAlign: 'center' }}>
              <h3 className="gold-text" style={{ fontSize: '1.8rem', margin: 0 }}>Complete Payment</h3>
            </div>
            
            {!paymentSuccess ? (
              <>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '20px', marginBottom: '25px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ color: '#888', margin: '0 0 10px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Installment Month {selectedMonth}</p>
                  <div style={{ fontSize: '2.5rem', color: '#fff', fontFamily: '"Playfair Display", serif', marginBottom: '15px' }}>₹{scheme.monthly_amount}</div>
                  
                  {currentGoldRate > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Live 22K Rate</div>
                        <div style={{ color: '#b8923a', fontWeight: 'bold' }}>₹{currentGoldRate}/g</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Securing Approx.</div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{(scheme.monthly_amount / currentGoldRate).toFixed(4)}g</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <form onSubmit={submitPayment}>
                  <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', color: '#888', marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Select Payment Method</label>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <label style={{ flex: 1, padding: '15px', border: `1px solid ${paymentMethod === 'UPI' ? '#b8923a' : 'rgba(255,255,255,0.1)'}`, background: paymentMethod === 'UPI' ? 'rgba(184,146,58,0.1)' : 'rgba(0,0,0,0.3)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', color: paymentMethod === 'UPI' ? '#b8923a' : '#888', transition: 'all 0.3s', fontWeight: 'bold' }}>
                        <input type="radio" name="method" value="UPI" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} style={{ display: 'none' }} />
                        UPI / QR Code
                      </label>
                      <label style={{ flex: 1, padding: '15px', border: `1px solid ${paymentMethod === 'Cash' ? '#b8923a' : 'rgba(255,255,255,0.1)'}`, background: paymentMethod === 'Cash' ? 'rgba(184,146,58,0.1)' : 'rgba(0,0,0,0.3)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', color: paymentMethod === 'Cash' ? '#b8923a' : '#888', transition: 'all 0.3s', fontWeight: 'bold' }}>
                        <input type="radio" name="method" value="Cash" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} style={{ display: 'none' }} />
                        Cash at Store
                      </label>
                    </div>
                  </div>

                  {paymentMethod === 'UPI' && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '25px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px', textAlign: 'center' }}>
                      <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Scan the QR code to make your secure payment.</p>
                      
                      <div style={{ padding: '15px', background: '#fff', display: 'inline-block', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginBottom: '20px' }}>
                        <img 
                          src={supabase.storage.from('payment_screenshots').getPublicUrl('admin_qr_code.png').data.publicUrl} 
                          alt="Store QR Code" 
                          style={{ width: '180px', height: '180px', objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>

                      <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold', marginBottom: '25px', letterSpacing: '1px' }}>
                        UPI ID: <span style={{ color: '#b8923a' }}>{storeUpi}</span>
                      </div>
                      
                      <div style={{ textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <label style={{ display: 'block', color: '#ccc', marginBottom: '12px', fontSize: '0.85rem' }}>Upload Transaction Screenshot</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => setScreenshotFile(e.target.files[0])}
                          style={{ color: '#fff', width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px dashed #b8923a', borderRadius: '4px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Cash' && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '25px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🏪</div>
                      <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.5' }}>Please visit the ND Jewellers store to deposit cash. Click submit below to notify the admin of your upcoming visit.</p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={uploading}
                    className="btn-luxury"
                    style={{ width: '100%', padding: '18px', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer' }}>
                    {uploading ? 'Processing Securely...' : 'Confirm Payment'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(40,167,69,0.1)', color: '#28a745', fontSize: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', boxShadow: '0 0 30px rgba(40,167,69,0.2)' }}>
                  ✓
                </div>
                <h4 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px', fontFamily: '"Playfair Display", serif' }}>Payment Submitted</h4>
                <p style={{ color: '#aaa', marginBottom: '40px', lineHeight: '1.5' }}>Your request has been securely sent. It is currently pending admin verification.</p>
                
                <a 
                  href={`https://wa.me/910000000000?text=${encodeURIComponent(`Hello ND JEWELLERS! I have just paid my EMI of ₹${scheme.monthly_amount} for Month ${selectedMonth}. My registered phone number is ${user.phone_number}. Please approve my payment.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowModal(false)}
                  style={{ display: 'block', width: '100%', padding: '16px', background: '#25D366', color: '#fff', textDecoration: 'none', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '8px', marginBottom: '15px', letterSpacing: '1px', transition: 'all 0.3s', boxShadow: '0 8px 20px rgba(37, 211, 102, 0.3)' }}>
                  Notify Admin on WhatsApp
                </a>
                <button 
                  onClick={() => setShowModal(false)}
                  style={{ width: '100%', padding: '16px', background: 'transparent', color: '#888', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseOver={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#fff'; }}
                  onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#888'; }}>
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
