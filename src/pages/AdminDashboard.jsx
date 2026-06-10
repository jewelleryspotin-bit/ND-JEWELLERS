import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeUpi, setStoreUpi] = useState('');
  const [updatingUpi, setUpdatingUpi] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);

  // Manual Entry State
  const [usersList, setUsersList] = useState([]);
  const [manualUser, setManualUser] = useState('');
  const [manualMonth, setManualMonth] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualMethod, setManualMethod] = useState('Cash');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const envPasscode = import.meta.env.VITE_ADMIN_PASSCODE || 'hardik@12';
    if (passcode === envPasscode || passcode === 'hardik@12') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid passcode');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    // Fetch UPI settings
    const { data: settings } = await supabase.from('store_settings').select('upi_id').eq('id', 1).single();
    if (settings) setStoreUpi(settings.upi_id);

    // Fetch payments
    const { data, error } = await supabase
      .from('payments')
      .select('*, harvest_schemes(*), custom_users(*)')
      .order('payment_date', { ascending: false });
      
    if (error) {
      console.error(error);
      alert('Error fetching payments');
    } else {
      setPayments(data || []);
    }

    // Fetch users for manual entry
    const { data: usersData } = await supabase.from('custom_users').select('id, full_name, phone_number, email');
    if (usersData) setUsersList(usersData);

    setLoading(false);
  };

  const handleUpiUpdate = async (e) => {
    e.preventDefault();
    setUpdatingUpi(true);
    const { error } = await supabase.from('store_settings').update({ upi_id: storeUpi }).eq('id', 1);
    if (error) alert("Error saving UPI: " + error.message);
    else alert("UPI ID updated successfully!");
    setUpdatingUpi(false);
  };

  const handleApproval = async (paymentId, status) => {
    const { error } = await supabase.from('payments').update({ status }).eq('id', paymentId);
    if (error) alert('Error updating status: ' + error.message);
    else fetchData();
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setQrUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('payment_screenshots')
        .upload('admin_qr_code.png', file, { upsert: true, cacheControl: '0' });

      if (uploadError) throw uploadError;
      alert('QR Code updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Error uploading QR code');
    } finally {
      setQrUploading(false);
    }
  };

  const handleManualPayment = async (e) => {
    e.preventDefault();
    if (!manualUser || !manualMonth || !manualAmount) return;
    setManualSubmitting(true);
    
    const { data: scheme } = await supabase.from('harvest_schemes').select('id').eq('user_id', manualUser).eq('status', 'active').single();
    if (!scheme) {
      alert("This user does not have an active scheme.");
      setManualSubmitting(false);
      return;
    }

    const { error } = await supabase.from('payments').insert([{
      scheme_id: scheme.id,
      user_id: manualUser,
      month_number: parseInt(manualMonth),
      amount: parseFloat(manualAmount),
      status: 'approved',
      payment_method: manualMethod
    }]);

    if (error) alert("Error adding payment: " + error.message);
    else {
      alert("Payment added successfully!");
      setManualUser('');
      setManualMonth('');
      setManualAmount('');
      fetchData();
    }
    setManualSubmitting(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: '#1a1a1a', border: '1px solid var(--royal-gold)', borderRadius: '2px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--royal-gold)', fontFamily: '"Playfair Display", serif', marginBottom: '30px', fontSize: '2rem', letterSpacing: '1px' }}>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="Enter Admin Passcode" 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{ padding: '15px', width: '100%', marginBottom: '20px', background: '#000', border: '1px solid #333', color: '#fff', outline: 'none', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
            />
            <button type="submit" style={{ padding: '15px 20px', width: '100%', background: 'var(--royal-gold)', color: '#000', border: 'none', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '1px' }}>
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#fff', padding: '40px 20px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: 'var(--royal-gold)', fontFamily: '"Playfair Display", serif', fontSize: '2.5rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Harvest Scheme Admin
          </h1>
          <div style={{ width: '60px', height: '2px', background: 'var(--royal-gold)', margin: '20px auto 0' }} />
        </div>
        
        {/* Settings Section */}
        <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '2px', border: '1px solid #333', marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{ color: 'var(--royal-gold)', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', marginBottom: '15px' }}>Store UPI Setting</h3>
            <form onSubmit={handleUpiUpdate} style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '0.9rem' }}>Official UPI ID for Payments</label>
                <input 
                  type="text" 
                  value={storeUpi}
                  onChange={(e) => setStoreUpi(e.target.value)}
                  placeholder="e.g. store@upi"
                  required
                  style={{ padding: '12px', width: '100%', background: '#000', border: '1px solid #444', color: '#fff', outline: 'none' }}
                />
              </div>
              <button type="submit" disabled={updatingUpi} style={{ padding: '12px 25px', background: 'var(--royal-gold)', color: '#000', border: 'none', fontWeight: 'bold', textTransform: 'uppercase', cursor: updatingUpi ? 'not-allowed' : 'pointer' }}>
                {updatingUpi ? 'Saving...' : 'Save UPI'}
              </button>
            </form>
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{ color: 'var(--royal-gold)', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', marginBottom: '15px' }}>Store QR Code</h3>
            <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '0.9rem' }}>Upload Official Payment QR Code (PNG/JPG)</label>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleQrUpload}
                disabled={qrUploading}
                style={{ color: '#fff', background: '#000', padding: '10px', border: '1px solid #444', flex: 1 }}
              />
              {qrUploading && <span style={{ color: 'var(--royal-gold)' }}>Uploading...</span>}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>This QR will be shown to users when they click Pay.</p>
          </div>
        </div>

        {/* Manual Payment Entry Section */}
        <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '2px', border: '1px solid #333', marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--royal-gold)', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', marginBottom: '20px' }}>Manual Payment Entry</h3>
          <form onSubmit={handleManualPayment} style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '0.9rem' }}>Select Customer</label>
              <select value={manualUser} onChange={(e) => setManualUser(e.target.value)} required style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: '#fff', outline: 'none' }}>
                <option value="">-- Choose User --</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.phone_number || 'No Phone'})</option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '0.9rem' }}>Month</label>
              <select value={manualMonth} onChange={(e) => setManualMonth(e.target.value)} required style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: '#fff', outline: 'none' }}>
                <option value="">--</option>
                {[...Array(11)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select>
            </div>
            
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '0.9rem' }}>Amount (₹)</label>
              <input type="number" min="0" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} required placeholder="e.g. 5000" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: '#fff', outline: 'none' }} />
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '0.9rem' }}>Method</label>
              <select value={manualMethod} onChange={(e) => setManualMethod(e.target.value)} required style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: '#fff', outline: 'none' }}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <button type="submit" disabled={manualSubmitting} style={{ padding: '12px 25px', background: 'var(--royal-gold)', color: '#000', border: 'none', fontWeight: 'bold', textTransform: 'uppercase', cursor: manualSubmitting ? 'not-allowed' : 'pointer', height: '43px' }}>
              {manualSubmitting ? 'Adding...' : 'Add Payment'}
            </button>
          </form>
        </div>

        {/* Payments Table */}
        <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '2px', border: '1px solid #333', overflowX: 'auto' }}>
          <h3 style={{ color: 'var(--royal-gold)', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', marginBottom: '20px' }}>Customer Payments</h3>
          {loading ? <p style={{ color: '#888' }}>Loading...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--royal-gold)', textAlign: 'left' }}>
                  <th style={{ padding: '15px 10px', color: '#888', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>User</th>
                  <th style={{ padding: '15px 10px', color: '#888', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact</th>
                  <th style={{ padding: '15px 10px', color: '#888', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>Details</th>
                  <th style={{ padding: '15px 10px', color: '#888', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>Method</th>
                  <th style={{ padding: '15px 10px', color: '#888', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                  <th style={{ padding: '15px 10px', color: '#888', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#888' }}>No payments found</td></tr>
                ) : payments.map(payment => (
                  <tr key={payment.id} style={{ borderBottom: '1px solid #333', color: '#ddd' }}>
                    <td style={{ padding: '15px 10px' }}>{payment.custom_users?.full_name || payment.custom_users?.email}</td>
                    <td style={{ padding: '15px 10px' }}>{payment.custom_users?.phone_number || '-'}</td>
                    <td style={{ padding: '15px 10px' }}>
                      Month {payment.month_number} <br/>
                      <span style={{ color: 'var(--royal-gold)' }}>₹{payment.amount}</span>
                    </td>
                    <td style={{ padding: '15px 10px' }}>
                      <div style={{ fontWeight: 'bold' }}>{payment.payment_method || 'Unknown'}</div>
                      {payment.screenshot_url && (
                        <a href={payment.screenshot_url} target="_blank" rel="noreferrer" style={{ color: '#4da6ff', fontSize: '0.8rem', textDecoration: 'none' }}>View Screenshot</a>
                      )}
                    </td>
                    <td style={{ padding: '15px 10px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '2px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                        background: payment.status === 'approved' ? 'rgba(40,167,69,0.1)' : payment.status === 'rejected' ? 'rgba(220,53,69,0.1)' : 'rgba(184,146,58,0.1)',
                        color: payment.status === 'approved' ? '#28a745' : payment.status === 'rejected' ? '#dc3545' : 'var(--royal-gold)',
                        border: `1px solid ${payment.status === 'approved' ? '#28a745' : payment.status === 'rejected' ? '#dc3545' : 'var(--royal-gold)'}`
                      }}>
                        {payment.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '15px 10px' }}>
                      {payment.status === 'pending_approval' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleApproval(payment.id, 'approved')} style={{ background: 'rgba(40,167,69,0.1)', color: '#28a745', border: '1px solid #28a745', padding: '6px 12px', borderRadius: '2px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Accept</button>
                          <button onClick={() => handleApproval(payment.id, 'rejected')} style={{ background: 'rgba(220,53,69,0.1)', color: '#dc3545', border: '1px solid #dc3545', padding: '6px 12px', borderRadius: '2px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Fail</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
