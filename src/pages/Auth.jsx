import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { showToast } from '../components/ui/Toast';

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const { data, error } = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    if (isSignup && !data.session) {
      showToast('Check your email to confirm your account');
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <div
      className="page-scroll"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px',
        paddingBottom: 32,
        minHeight: '100%',
      }}
    >
      <div className="fade-up" style={{ width: '100%', maxWidth: 366 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            className="label-caps"
            style={{ color: 'var(--sage)', marginBottom: 10 }}
          >
            The Resale Studio
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: 38,
              lineHeight: 1.05,
              color: 'var(--charcoal)',
              marginBottom: 10,
            }}
          >
            FlipTracker
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--bark)', lineHeight: 1.45 }}>
            {isSignup
              ? 'Create your account to start tracking your finds.'
              : 'Welcome back — sign in to your shop.'}
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="card"
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <Input
            label="Email"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            size="full"
            variant="primary"
            disabled={loading || !email || !password}
            style={{ marginTop: 4 }}
          >
            {loading ? (
              <span className="spinner" />
            ) : isSignup ? (
              'Create Account'
            ) : (
              'Log In'
            )}
          </Button>
        </form>

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--bark)' }}>
          {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
          <button
            type="button"
            onClick={() => setMode(isSignup ? 'login' : 'signup')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--sienna)',
            }}
          >
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
}
