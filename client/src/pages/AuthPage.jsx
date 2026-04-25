import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    name: '',
    passcode: '',
    confirmPasscode: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (activeTab === 'login') {
      if (!form.name.trim()) errs.name = 'Name is required';
    }
    if (activeTab === 'signup') {
      if (!form.name.trim()) errs.name = 'Name is required';
      else if (form.name.trim().length < 2) errs.name = 'At least 2 characters';
    }
    if (!form.passcode) errs.passcode = 'Passcode is required';
    else if (form.passcode.length < 4) errs.passcode = 'At least 4 characters';
    if (activeTab === 'signup' && form.passcode !== form.confirmPasscode) {
      errs.confirmPasscode = 'Passcodes do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res =
        activeTab === 'signup'
          ? await authApi.signup(form.name.trim(), form.passcode)
          : await authApi.login(form.name.trim(), form.passcode);
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(activeTab === 'signup' ? 'Welcome to AlignCV!' : 'Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.error || 'Something went wrong';
      toast.error(message);
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrors({});
    setFocusedField(null);
    setForm({ name: '', passcode: '', confirmPasscode: '' });
  };

  // ── Style constants ──────────────────────────────────────────────
  const colors = {
    bg: '#000000',
    card: 'transparent',
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryLight: '#818cf8',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.75)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.2)',
    borderHover: 'rgba(255, 255, 255, 0.4)',
    error: '#f87171',
    errorBg: 'rgba(239, 68, 68, 0.15)',
    errorBorder: 'rgba(239, 68, 68, 0.3)',
  };

  const inputStyle = (fieldName) => ({
    width: '100%',
    height: '48px',
    padding: '0 16px',
    fontSize: '15px',
    color: colors.text,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: `1.5px solid ${
      errors[fieldName]
        ? colors.error
        : focusedField === fieldName
        ? colors.primary
        : 'rgba(255, 255, 255, 0.15)'
    }`,
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxShadow:
      focusedField === fieldName
        ? `0 0 0 4px rgba(99, 102, 241, 0.2)`
        : 'none',
    boxSizing: 'border-box',
  });

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '8px',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  };

  const errorTextStyle = {
    fontSize: '12px',
    color: colors.error,
    fontWeight: 500,
    marginTop: '6px',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        backgroundImage: "url('/authbg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Invisible Card Wrapper */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'transparent',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo — mb 12px to tabs */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: colors.text,
              letterSpacing: '0.02em',
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            Align
            <span style={{ color: colors.primary }}>CV</span>
          </h1>
        </div>

        {/* Tabs */}
        {/* Tabs — mb 16px to heading */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {['login', 'signup'].map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              style={{
                flex: 1,
                paddingBottom: '12px',
                fontSize: '15px',
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? colors.text : colors.textMuted,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab
                  ? `2px solid ${colors.primary}`
                  : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}
            >
              {tab === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Heading */}
        {/* Form — 16px gap between inputs */}
        {errors.general && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: colors.errorBg,
              border: `1px solid ${colors.errorBorder}`,
              color: colors.error,
              fontSize: '13px',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            {errors.general}
          </div>
        )}

        {/* Form */}
        {/* Form — 16px gap between inputs */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* Name */}
          <div>
            <label style={labelStyle}>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter your name"
              style={inputStyle('name')}
            />
            {errors.name && <p style={errorTextStyle}>{errors.name}</p>}
          </div>

          {/* Passcode */}
          <div>
            <label style={labelStyle}>Passcode</label>
            <input
              name="passcode"
              type="password"
              value={form.passcode}
              onChange={handleChange}
              onFocus={() => setFocusedField('passcode')}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter your passcode"
              style={inputStyle('passcode')}
            />
            {errors.passcode && <p style={errorTextStyle}>{errors.passcode}</p>}
          </div>

          {/* Confirm Passcode (signup only) */}
          {activeTab === 'signup' && (
            <div>
              <label style={labelStyle}>Confirm Passcode</label>
              <input
                name="confirmPasscode"
                type="password"
                value={form.confirmPasscode}
                onChange={handleChange}
                onFocus={() => setFocusedField('confirmPasscode')}
                onBlur={() => setFocusedField(null)}
                placeholder="Confirm your passcode"
                style={inputStyle('confirmPasscode')}
              />
              {errors.confirmPasscode && (
                <p style={errorTextStyle}>{errors.confirmPasscode}</p>
              )}
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '44px',
              marginTop: '4px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = `linear-gradient(135deg, ${colors.primaryHover}, ${colors.primary})`;
                e.target.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`;
              e.target.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.3)';
            }}
          >
            {loading ? (
              <svg
                style={{
                  animation: 'spin 1s linear infinite',
                  width: '20px',
                  height: '20px',
                  marginRight: '8px',
                }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  style={{ opacity: 0.25 }}
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  style={{ opacity: 0.75 }}
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              activeTab === 'login' ? 'Log In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            fontSize: '13px',
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: '16px',
          }}
        >
          {activeTab === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => switchTab('signup')}
                style={{
                  color: colors.primary,
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: 0,
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => switchTab('login')}
                style={{
                  color: colors.primary,
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: 0,
                }}
              >
                Log in
              </button>
            </>
          )}
        </p>


      </div>
    </div>
  );
}
