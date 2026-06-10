import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [scheme, setScheme] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeUpi, setStoreUpi] = useState('admin@upi');
  
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

    const { error } = await supabase.from('payments').insert([{ 
      scheme_id: scheme.id, 
      user_id: user.id, 
      month_number: selectedMonth, 
      amount: scheme.monthly_amount,
      status: 'pending_approval',
      payment_method: paymentMethod,
      screenshot_url: screenshot_url
    }]);

    if (error) alert('Error submitting payment: ' + error.message);
    else {
      setPaymentSuccess(true);
      fetchData();
    }
    setUploading(false);
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#111', color: 'var(--royal-gold)' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#fff', padding: '40px 20px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: 'var(--royal-gold)', fontFamily: '"Playfair Display", serif', fontSize: '2.5rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
            My Digital Gold Harvest
          </h1>
          <p style={{ color: '#aaa', fontSize: '1.1rem', marginTop: '10px' }}>
            Welcome back, <span style={{ color: '#fff' }}>{user?.full_name || 'Customer'}</span>
          </p>
          <div style={{ width: '60px', height: '2px', background: 'var(--royal-gold)', margin: '20px auto 0' }} />
        </div>
        
        {!scheme ? (
          <div style={{ background: '#1a1a1a', padding: '40px', border: '1px solid #333', borderRadius: '2px', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--royal-gold)', fontSize: '1.8rem', fontFamily: '"Playfair Display", serif' }}>Start a New Scheme</h3>
            <p style={{ color: '#ccc', margin: '15px 0 30px', fontSize: '1.1rem' }}>Invest for 11 months, and get the 12th month as a BONUS from us!</p>
            <form onSubmit={startScheme} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '0.9rem' }}>Monthly Installment Amount (₹)</label>
                <input 
                  type="number" 
                  name="amount" 
                  min="1000" 
                  step="500" 
                  required 
                  style={{ padding: '15px', background: 'transparent', border: '1px solid var(--royal-gold)', color: '#fff', outline: 'none', width: '300px', textAlign: 'center', fontSize: '1.2rem' }} 
                />
              </div>
              <button type="submit" style={{ padding: '15px 40px', background: 'var(--royal-gold)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Start Now
              </button>
            </form>
          </div>
        ) : (
          <div style={{ background: '#1a1a1a', padding: '40px', border: '1px solid #333', borderRadius: '2px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
              <div>
                <h3 style={{ color: 'var(--royal-gold)', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem' }}>Active Scheme</h3>
                <p style={{ color: '#888', marginTop: '5px' }}>Started: {new Date(scheme.start_date).toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Monthly Installment</p>
                <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>₹{scheme.monthly_amount}</p>
              </div>
            </div>
            
            <h4 style={{ color: 'var(--royal-gold)', marginBottom: '20px', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Payment Schedule</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {[...Array(11)].map((_, i) => {
                const monthNum = i + 1;
                const payment = payments.find(p => p.month_number === monthNum);
                
                let statusText = "Unpaid";
                let statusColor = "#888";
                let borderColor = "#333";
                let bg = "transparent";

                if (payment) {
                  if (payment.status === 'approved') { statusText = "Approved"; statusColor = "#28a745"; borderColor = "#28a745"; bg = "rgba(40,167,69,0.05)"; }
                  else if (payment.status === 'pending_approval') { statusText = "Pending Approval"; statusColor = "var(--royal-gold)"; borderColor = "var(--royal-gold)"; bg = "rgba(184,146,58,0.05)"; }
                  else if (payment.status === 'rejected') { statusText = "Rejected"; statusColor = "#dc3545"; borderColor = "#dc3545"; bg = "rgba(220,53,69,0.05)"; }
                }

                return (
                  <div key={monthNum} style={{ padding: '20px', border: `1px solid ${borderColor}`, borderRadius: '2px', textAlign: 'center', background: bg, position: 'relative' }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>Month {monthNum}</div>
                    <div style={{ color: statusColor, fontSize: '0.9rem', margin: '15px 0', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>{statusText}</div>
                    
                    {!payment || payment.status === 'rejected' ? (
                      <button 
                        onClick={() => openPaymentModal(monthNum)}
                        style={{ background: 'transparent', color: 'var(--royal-gold)', border: '1px solid var(--royal-gold)', padding: '8px 15px', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', width: '100%', transition: 'all 0.2s' }}>
                        Pay Now
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(payment.payment_date).toLocaleDateString()}</div>
                    )}
                  </div>
                );
              })}
              
              {/* 12th Month Bonus */}
              <div style={{ padding: '20px', border: '1px dashed var(--royal-gold)', borderRadius: '2px', textAlign: 'center', background: 'rgba(184,146,58,0.05)' }}>
                <div style={{ color: 'var(--royal-gold)', fontWeight: 'bold', fontSize: '1.1rem' }}>Month 12</div>
                <div style={{ margin: '15px 0', fontWeight: 'bold', color: '#fff', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>BONUS</div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>Unlocks automatically</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#1a1a1a', padding: '40px', width: '100%', maxWidth: '500px', border: '1px solid var(--royal-gold)', borderRadius: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--royal-gold)', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem' }}>Submit Payment</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            
            
            {!paymentSuccess ? (
              <>
                <p style={{ color: '#ccc', marginBottom: '20px' }}>You are paying <strong>₹{scheme.monthly_amount}</strong> for <strong>Month {selectedMonth}</strong>.</p>
                
                <form onSubmit={submitPayment}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#888', marginBottom: '10px', fontSize: '0.9rem' }}>Payment Method</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <label style={{ flex: 1, padding: '10px', border: `1px solid ${paymentMethod === 'UPI' ? 'var(--royal-gold)' : '#444'}`, textAlign: 'center', cursor: 'pointer', color: paymentMethod === 'UPI' ? 'var(--royal-gold)' : '#fff' }}>
                        <input type="radio" name="method" value="UPI" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} style={{ display: 'none' }} />
                        UPI / QR Code
                      </label>
                      <label style={{ flex: 1, padding: '10px', border: `1px solid ${paymentMethod === 'Cash' ? 'var(--royal-gold)' : '#444'}`, textAlign: 'center', cursor: 'pointer', color: paymentMethod === 'Cash' ? 'var(--royal-gold)' : '#fff' }}>
                        <input type="radio" name="method" value="Cash" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} style={{ display: 'none' }} />
                        Cash at Store
                      </label>
                    </div>
                  </div>

                  {paymentMethod === 'UPI' && (
                    <div style={{ background: '#111', padding: '20px', border: '1px solid #333', marginBottom: '20px', textAlign: 'center' }}>
                      <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px' }}>Please scan the QR or pay to the UPI ID below:</p>
                      
                      <div style={{ marginBottom: '20px', padding: '10px', background: '#fff', display: 'inline-block', borderRadius: '4px' }}>
                        <img 
                          src={supabase.storage.from('payment_screenshots').getPublicUrl('admin_qr_code.png').data.publicUrl} 
                          alt="Store QR Code" 
                          style={{ width: '200px', height: '200px', objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>

                      <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 'bold', marginBottom: '20px', padding: '10px', border: '1px dashed var(--royal-gold)' }}>
                        UPI ID: {storeUpi}
                      </div>
                      
                      <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', color: 'var(--royal-gold)', marginBottom: '10px', fontSize: '0.9rem' }}>Upload Payment Screenshot</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => setScreenshotFile(e.target.files[0])}
                          style={{ color: '#ccc', width: '100%' }}
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Cash' && (
                    <div style={{ background: '#111', padding: '20px', border: '1px solid #333', marginBottom: '20px', textAlign: 'center' }}>
                      <p style={{ color: '#ccc', fontSize: '0.9rem' }}>Please visit the store and deposit the cash. Click submit to notify the admin.</p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={uploading}
                    style={{ width: '100%', padding: '15px', background: 'var(--royal-gold)', color: '#000', border: 'none', fontWeight: 'bold', textTransform: 'uppercase', cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
                    {uploading ? 'Submitting...' : 'Submit Payment Request'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(40,167,69,0.1)', color: '#28a745', fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  ✓
                </div>
                <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '10px' }}>Payment Submitted!</h4>
                <p style={{ color: '#aaa', marginBottom: '30px' }}>Your payment request has been sent for admin approval.</p>
                
                <a 
                  href={`https://wa.me/910000000000?text=${encodeURIComponent(`Hello ND JEWELLERS! I have just paid my EMI of ₹${scheme.monthly_amount} for Month ${selectedMonth}. My registered phone number is ${user.phone_number}. Please approve my payment.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowModal(false)}
                  style={{ display: 'block', width: '100%', padding: '15px', background: '#25D366', color: '#fff', textDecoration: 'none', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '2px', marginBottom: '10px', letterSpacing: '1px', transition: 'transform 0.3s' }}>
                  Notify Admin on WhatsApp
                </a>
                <button 
                  onClick={() => setShowModal(false)}
                  style={{ width: '100%', padding: '15px', background: 'transparent', color: '#888', border: '1px solid #333', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
