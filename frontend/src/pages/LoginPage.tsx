import { useState } from 'react';
import { authService } from '../services/authService';
import CustomLoader from '../components/CustomLoader';
import { ParticleNetworkBackground } from '../components/ParticleNetworkBackground';

interface LoginPageProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginPage({ onLogin, onSwitchToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const getErrorMessage = (errorCode: string, message: string) => {
    switch (errorCode) {
      case 'ACCOUNT_PENDING':
        return {
          title: 'Account Pending Approval',
          message:
            'Your account is awaiting approval from an administrator. You will be able to log in once your account has been approved.',
          type: 'warning' as const,
        };
      case 'ACCOUNT_REJECTED':
        return {
          title: 'Account Rejected',
          message: message || 'Your account has been rejected by an administrator.',
          type: 'error' as const,
        };
      case 'ACCOUNT_DEACTIVATED':
        return {
          title: 'Account Deactivated',
          message:
            'Your account has been deactivated. Please contact an administrator for assistance.',
          type: 'error' as const,
        };
      default:
        return {
          title: 'Login Failed',
          message: message || 'Invalid email or password',
          type: 'error' as const,
        };
    }
  };

  const [errorInfo, setErrorInfo] = useState<{
    title: string;
    message: string;
    type: 'error' | 'warning';
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorInfo(null);
    setLoading(true);

    try {
      await authService.login({ email, password });
      onLogin();
    } catch (err: any) {
      const errorCode = err.response?.data?.error?.code;
      const errorMessage = err.response?.data?.error?.message;

      if (errorCode) {
        setErrorInfo(getErrorMessage(errorCode, errorMessage));
      } else {
        setError(errorMessage || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 relative" style={{ background: '#000000', height: '100%', flex: 1, overflow: 'hidden' }}>
      <ParticleNetworkBackground
        particleCount={80}
        particleSize={2}
        particleColor="#00d4ff"
        lineColor="rgba(0, 212, 255, 0.15)"
        maxDistance={120}
        speed={0.5}
        interactive={true}
      />
      <h1
        className="text-center font-bold z-10"
        style={{
          fontSize: '2.5rem',
          fontFamily: '"Orbitron", "Exo 2", "Rajdhani", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 50%, #3700ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 40px rgba(0, 212, 255, 0.6), 0 0 80px rgba(0, 255, 136, 0.4)',
          filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.8))',
          letterSpacing: '0.08em',
          lineHeight: '1.2',
          textTransform: 'uppercase',
          marginBottom: '2rem'
        }}
      >
        Welcome to<br />Mammogram X-Ray Screener
      </h1>

      <div className="flex items-center justify-center z-10 w-full">
        {/* Login Form - Center */}
        <div className="card" style={{ padding: '8px', maxWidth: '380px', width: '100%' }}>
          <div className="card2 form" style={{ padding: '0.8em', borderRadius: '12px' }}>
            <p id="heading">LOGIN</p>

            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {errorInfo && (
              <div
                className={`${errorInfo.type === 'warning'
                  ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400'
                  : 'bg-red-900/20 border-red-500/50 text-red-400'
                  } border px-4 py-3 rounded-lg mb-4 text-sm`}
              >
                <p className="font-semibold mb-1">{errorInfo.title}</p>
                <p className="text-xs opacity-90">{errorInfo.message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <svg className="input-icon" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                  <path d="M207.8 20.73c-93.45 18.32-168.7 93.66-187 187.1c-27.64 140.9 68.65 266.2 199.1 285.1c19.01 2.888 36.17-12.26 36.17-31.49l.0001-.6631c0-15.74-11.44-28.88-26.84-31.24c-84.35-12.98-149.2-86.13-149.2-174.2c0-102.9 88.61-185.5 193.4-175.4c91.54 8.869 158.6 91.25 158.6 183.2l0 16.16c0 22.09-17.94 40.05-40 40.05s-40.01-17.96-40.01-40.05v-120.1c0-8.847-7.161-16.02-16.01-16.02l-31.98 .0036c-7.299 0-13.2 4.992-15.12 11.68c-24.85-12.15-54.24-16.38-86.06-5.106c-38.75 13.73-68.12 48.91-73.72 89.64c-9.483 69.01 43.81 128 110.9 128c26.44 0 50.43-9.544 69.59-24.88c24 31.3 65.23 48.69 109.4 37.49C465.2 369.3 496 324.1 495.1 277.2V256.3C495.1 107.1 361.2-9.332 207.8 20.73zM239.1 304.3c-26.47 0-48-21.56-48-48.05s21.53-48.05 48-48.05s48 21.56 48 48.05S266.5 304.3 239.1 304.3z"></path>
                </svg>
                <input
                  type="email"
                  className="input-field"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <svg className="input-icon" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                  <path d="M80 192V144C80 64.47 144.5 0 224 0C303.5 0 368 64.47 368 144V192H384C419.3 192 448 220.7 448 256V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V256C0 220.7 28.65 192 64 192H80zM144 192H304V144C304 99.82 268.2 64 224 64C179.8 64 144 99.82 144 144V192z"></path>
                </svg>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="btn">
                <button type="submit" className="button2" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <CustomLoader size={16} />
                      Authenticating...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>

              <button
                type="button"
                className="button3"
                onClick={onSwitchToRegister}
                style={{ width: '100%', marginTop: '1em' }}
              >
                Don't have an account? Register
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
