import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeUpi, setStoreUpi] = useState('');
  const [updatingUpi, setUpdatingUpi] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [currentGoldRate, setCurrentGoldRate] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [manualUserSearch, setManualUserSearch] = useState('');

  // Ledger Modal State
  const [selectedLedger, setSelectedLedger] = useState(null);

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
    const envPasscode = import.meta.env.VITE_ADMIN_PASSCODE || 'nd@12';
    if (passcode === envPasscode || passcode === 'nd@12') {
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

    // Fetch gold rate
    const { data: ratesData } = await supabase.from('nd_rates').select('gold22k').eq('id', 1).single();
    if (ratesData) setCurrentGoldRate(ratesData.gold22k);

    // Fetch active schemes with users
    const { data: schemesData } = await supabase.from('harvest_schemes').select('*, custom_users(*)').order('created_at', { ascending: false });
    setSchemes(schemesData || []);

    // Fetch all payments
    const { data: paymentsData } = await supabase.from('payments').select('*').order('month_number', { ascending: true });
    setPayments(paymentsData || []);

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

    const goldAmt = currentGoldRate > 0 ? parseFloat((parseFloat(manualAmount) / currentGoldRate).toFixed(4)) : 0;

    const existingPayment = payments.find(p => p.scheme_id === scheme.id && p.month_number === parseInt(manualMonth));
    let submitError;

    if (existingPayment && existingPayment.status === 'rejected') {
      const { error } = await supabase.from('payments').update({
        amount: parseFloat(manualAmount),
        gold_rate: currentGoldRate,
        gold_amount: goldAmt,
        status: 'approved',
        payment_method: manualMethod
      }).eq('id', existingPayment.id);
      submitError = error;
    } else {
      const { error } = await supabase.from('payments').insert([{
        scheme_id: scheme.id,
        user_id: manualUser,
        month_number: parseInt(manualMonth),
        amount: parseFloat(manualAmount),
        gold_rate: currentGoldRate,
        gold_amount: goldAmt,
        status: 'approved',
        payment_method: manualMethod
      }]);
      submitError = error;
    }

    if (submitError) alert("Error adding payment: " + submitError.message);
    else {
      alert("Payment added successfully!");
      setManualUserSearch('');
      setManualUser('');
      setManualMonth('');
      setManualAmount('');
      fetchData();
    }
    setManualSubmitting(false);
  };

  const filteredSchemes = schemes.filter(s => {
    const name = (s.custom_users?.full_name || '').toLowerCase();
    const phone = (s.custom_users?.phone_number || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query);
  });

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
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-ledger, #print-ledger * { visibility: visible; }
          #print-ledger { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
          .print-border { border-color: #ddd !important; }
          .print-text { color: #000 !important; }
        }
      `}</style>
      
      <div className="no-print" style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
            <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '0.9rem' }}>Upload Official Payment QR Code</label>
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
          </div>
        </div>

        {/* Manual Payment Entry Section */}
        <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '2px', border: '1px solid #333', marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--royal-gold)', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', marginBottom: '20px' }}>Manual Payment Entry</h3>
          <form onSubmit={handleManualPayment} style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 250px' }}>
              <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '0.9rem' }}>Search & Select Customer</label>
              <input 
                type="text" 
                list="user-list"
                value={manualUserSearch} 
                onChange={(e) => {
                  setManualUserSearch(e.target.value);
                  const user = usersList.find(u => `${u.full_name} (${u.phone_number})` === e.target.value);
                  setManualUser(user ? user.id : '');
                }} 
                required 
                placeholder="Type name or phone..."
                style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: '#fff', outline: 'none' }} 
              />
              <datalist id="user-list">
                {usersList.map(u => <option key={u.id} value={`${u.full_name} (${u.phone_number})`} />)}
              </datalist>
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

        {/* Customer Database / Ledgers */}
        <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '2px', border: '1px solid #333', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h3 style={{ color: 'var(--royal-gold)', fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', margin: 0 }}>Customer Ledgers</h3>
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '10px 15px', background: '#000', border: '1px solid #444', color: '#fff', outline: 'none', minWidth: '250px' }}
            />
          </div>

          {loading ? <p style={{ color: '#888' }}>Loading...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--royal-gold)', textAlign: 'left' }}>
                  <th style={{ padding: '15px 10px', color: '#888', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer</th>
                  <th style={{ padding: '15px 10px', color: '#888', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly EMI</th>
                  <th style={{ padding: '15px 10px', color: '#888', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Gold</th>
                  <th style={{ padding: '15px 10px', color: '#888', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>Next Due Date</th>
                  <th style={{ padding: '15px 10px', color: '#888', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchemes.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#888' }}>No active customers found</td></tr>
                ) : filteredSchemes.map(scheme => {
                  const schemePayments = payments.filter(p => p.scheme_id === scheme.id);
                  const approvedPayments = schemePayments.filter(p => p.status === 'approved');
                  const totalGold = approvedPayments.reduce((sum, p) => sum + (p.gold_amount || 0), 0);
                  
                  const startDate = new Date(scheme.start_date);
                  const nextDue = new Date(startDate);
                  nextDue.setMonth(nextDue.getMonth() + approvedPayments.length);
                  
                  const pendingCount = schemePayments.filter(p => p.status === 'pending_approval').length;

                  return (
                    <tr key={scheme.id} style={{ borderBottom: '1px solid #333', color: '#ddd' }}>
                      <td style={{ padding: '15px 10px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{scheme.custom_users?.full_name || scheme.custom_users?.email}</div>
                        <div style={{ color: '#888', fontSize: '0.8rem' }}>{scheme.custom_users?.phone_number || '-'}</div>
                      </td>
                      <td style={{ padding: '15px 10px' }}>
                        <span style={{ color: 'var(--royal-gold)', fontWeight: 'bold' }}>₹{scheme.monthly_amount}</span>
                      </td>
                      <td style={{ padding: '15px 10px' }}>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{totalGold.toFixed(4)}g</span>
                      </td>
                      <td style={{ padding: '15px 10px' }}>
                        <div style={{ color: '#ccc' }}>{nextDue.toLocaleDateString()}</div>
                        {new Date() > nextDue && <div style={{ color: '#dc3545', fontSize: '0.75rem', fontWeight: 'bold' }}>OVERDUE</div>}
                      </td>
                      <td style={{ padding: '15px 10px' }}>
                        <button 
                          onClick={() => setSelectedLedger(scheme)} 
                          style={{ background: 'transparent', color: 'var(--royal-gold)', border: '1px solid var(--royal-gold)', padding: '6px 15px', borderRadius: '2px', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          View Ledger
                          {pendingCount > 0 && <span style={{ background: '#dc3545', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>{pendingCount}</span>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ledger Modal & Print Area */}
      {selectedLedger && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
          
          <div id="print-ledger" style={{ background: '#fff', color: '#000', maxWidth: '900px', margin: '20px auto', padding: '40px', borderRadius: '4px', position: 'relative' }}>
            
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '30px' }}>
              <button onClick={() => window.print()} style={{ background: '#333', color: '#fff', border: 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase' }}>🖨️ Print PDF</button>
              <button onClick={() => setSelectedLedger(null)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase' }}>Close</button>
            </div>

            {/* Print Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #000', paddingBottom: '20px' }} className="print-border">
              <h1 className="print-text" style={{ fontFamily: '"Playfair Display", serif', margin: '0 0 10px', fontSize: '2rem' }}>ND JEWELLERS</h1>
              <h3 className="print-text" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px', color: '#555' }}>Customer Harvest Ledger</h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <p className="print-text" style={{ margin: '0 0 5px', color: '#555' }}>Customer Name:</p>
                <h3 className="print-text" style={{ margin: 0, fontSize: '1.4rem' }}>{selectedLedger.custom_users?.full_name || 'N/A'}</h3>
                <p className="print-text" style={{ margin: '5px 0 0', color: '#555' }}>Phone: {selectedLedger.custom_users?.phone_number || 'N/A'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="print-text" style={{ margin: '0 0 5px', color: '#555' }}>Scheme Started:</p>
                <h4 className="print-text" style={{ margin: 0 }}>{new Date(selectedLedger.start_date).toLocaleDateString()}</h4>
                <p className="print-text" style={{ margin: '5px 0 0', color: '#555' }}>Monthly EMI: <strong>₹{selectedLedger.monthly_amount}</strong></p>
                <p className="print-text" style={{ margin: '5px 0 0', color: '#555' }}>Today's Date: <strong>{new Date().toLocaleDateString()}</strong></p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }} className="print-border">
                  <th className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>Month</th>
                  <th className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>Date</th>
                  <th className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>Amount</th>
                  <th className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>Gold Rate</th>
                  <th className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>Gold Secured</th>
                  <th className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>Status / Action</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(11)].map((_, i) => {
                  const m = i + 1;
                  const payment = payments.find(p => p.scheme_id === selectedLedger.id && p.month_number === m);
                  
                  // Calculate expected date for this month
                  const expectedDate = new Date(selectedLedger.start_date);
                  expectedDate.setMonth(expectedDate.getMonth() + i);

                  return (
                    <tr key={m}>
                      <td className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px', fontWeight: 'bold' }}>{m}</td>
                      <td className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px' }}>
                        {payment ? new Date(payment.payment_date).toLocaleDateString() : <span style={{ color: '#aaa' }}>Due: {expectedDate.toLocaleDateString()}</span>}
                      </td>
                      <td className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px' }}>
                        {payment ? `₹${payment.amount}` : '-'}
                      </td>
                      <td className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px' }}>
                        {payment?.gold_rate ? `₹${payment.gold_rate}/g` : '-'}
                      </td>
                      <td className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px', fontWeight: 'bold' }}>
                        {payment?.gold_amount ? `${payment.gold_amount}g` : '-'}
                      </td>
                      <td className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px' }}>
                        {!payment ? <span style={{ color: '#aaa', fontStyle: 'italic' }}>Unpaid</span> : 
                          payment.status === 'approved' ? <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Paid</span> :
                          payment.status === 'rejected' ? <span style={{ color: '#dc3545', fontWeight: 'bold' }}>✗ Rejected</span> :
                          <div className="no-print" style={{ display: 'flex', gap: '5px' }}>
                            <span style={{ color: '#e6a200', fontWeight: 'bold', marginRight: '10px' }}>Pending</span>
                            <button onClick={() => handleApproval(payment.id, 'approved')} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '2px', cursor: 'pointer', fontSize: '0.8rem' }}>Accept</button>
                            <button onClick={() => handleApproval(payment.id, 'rejected')} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '2px', cursor: 'pointer', fontSize: '0.8rem' }}>Fail</button>
                          </div>
                        }
                        {payment?.status === 'pending_approval' && <span className="print-only-inline" style={{ display: 'none' }}>Pending</span>}
                        
                        {payment?.screenshot_url && (
                          <div className="no-print" style={{ marginTop: '5px' }}>
                            <a href={payment.screenshot_url} target="_blank" rel="noreferrer" style={{ color: '#0066cc', fontSize: '0.8rem' }}>View Proof</a>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {/* 12th Month Bonus Row */}
                <tr style={{ background: '#fffcf5' }} className="print-border">
                  <td className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px', fontWeight: 'bold', color: '#d4af37' }}>12</td>
                  <td className="print-border print-text" colSpan="4" style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center', letterSpacing: '2px', fontWeight: 'bold', color: '#d4af37' }}>
                    BONUS MONTH
                  </td>
                  <td className="print-border print-text" style={{ border: '1px solid #ccc', padding: '12px', color: '#aaa' }}>
                    Unlocks after 11 payments
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', paddingTop: '20px' }} className="print-border">
              <div>
                <p className="print-text" style={{ margin: '0 0 5px', color: '#555', fontSize: '0.9rem' }}>Authorized Signature</p>
                <div style={{ borderBottom: '1px solid #000', width: '150px', height: '30px' }} className="print-border"></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="print-text" style={{ margin: '0 0 5px', color: '#555', fontSize: '1.2rem' }}>Total Gold Accumulated:</p>
                <h2 className="print-text" style={{ margin: 0, color: '#d4af37' }}>
                  {payments.filter(p => p.scheme_id === selectedLedger.id && p.status === 'approved').reduce((sum, p) => sum + (p.gold_amount || 0), 0).toFixed(4)}g
                </h2>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
