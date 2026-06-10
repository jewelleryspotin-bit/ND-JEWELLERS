import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase
          .from('custom_users')
          .insert([{ email, password, full_name: fullName, phone_number: phone }])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') throw new Error('Email already registered.');
          throw error;
        }

        alert('Profile created successfully! You are now logged in.');
        localStorage.setItem('userId', data.id);
        navigate('/dashboard');
      } else {
        const { data, error } = await supabase
          .from('custom_users')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .single();

        if (error || !data) {
          throw new Error('Invalid email or password');
        }

        localStorage.setItem('userId', data.id);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#111',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '450px', 
        padding: '40px', 
        background: 'rgba(20, 20, 20, 0.85)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--royal-gold)',
        borderRadius: '2px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src="/assets/logo.png?v=4" alt="Logo" style={{ height: '60px', marginBottom: '15px' }} />
          <h2 style={{ 
            color: 'var(--royal-gold)', 
            fontFamily: '"Playfair Display", serif',
            fontSize: '2rem',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            {isSignUp ? 'Join the Harvest' : 'Welcome Back'}
          </h2>
          <p style={{ color: '#ccc', fontSize: '0.9rem', marginTop: '5px' }}>
            {isSignUp ? 'Begin your journey of pure gold' : 'Access your Digital Gold Harvest Dashboard'}
          </p>
        </div>
        
        {error && <div style={{ color: '#ff6b6b', background: 'rgba(255,0,0,0.1)', padding: '10px', marginBottom: '20px', textAlign: 'center', border: '1px solid #ff6b6b', borderRadius: '2px' }}>{error}</div>}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {isSignUp && (
            <>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ padding: '15px', background: 'transparent', border: '1px solid #444', color: '#fff', outline: 'none' }}
              />
              <input 
                type="text" 
                placeholder="Phone Number" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ padding: '15px', background: 'transparent', border: '1px solid #444', color: '#fff', outline: 'none' }}
              />
            </>
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '15px', background: 'transparent', border: '1px solid #444', color: '#fff', outline: 'none' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '15px', background: 'transparent', border: '1px solid #444', color: '#fff', outline: 'none' }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '15px', 
              background: 'var(--royal-gold)', 
              color: '#000', 
              border: 'none', 
              fontWeight: 'bold', 
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              marginTop: '10px'
            }}>
            {loading ? 'Processing...' : (isSignUp ? 'Create Profile' : 'Sign In')}
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.9rem' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have a profile? "}
            <span style={{ color: 'var(--royal-gold)', textDecoration: 'underline' }}>
              {isSignUp ? 'Sign In' : 'Join Now'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
