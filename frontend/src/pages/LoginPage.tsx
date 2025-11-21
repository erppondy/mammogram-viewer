import { useState } from 'react';
import { authService } from '../services/authService';
import { MedicalCard, MedicalButton, MedicalInput } from '../components/MedicalUI';

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
    <div className="min-h-screen bg-[var(--bg-primary)] medical-grid-bg flex items-center justify-center px-4">
      <MedicalCard className="max-w-md w-full p-8 scan-line-container">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--medical-primary)] to-[var(--medical-primary-dark)] rounded-xl mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold glow-text mb-2">
            Mammogram Viewer
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Medical Imaging System</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {errorInfo && (
          <div
            className={`${
              errorInfo.type === 'warning'
                ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400'
                : 'bg-red-900/20 border-red-500/50 text-red-400'
            } border px-4 py-3 rounded-lg mb-4`}
          >
            <p className="font-semibold mb-1">{errorInfo.title}</p>
            <p className="text-sm opacity-90">{errorInfo.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <MedicalInput
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <MedicalInput
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <MedicalButton
            type="submit"
            disabled={loading}
            fullWidth
            size="lg"
            icon={
              loading ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              )
            }
          >
            {loading ? 'Authenticating' : 'Sign In'}
          </MedicalButton>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--text-secondary)] text-sm">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-[var(--medical-primary)] hover:text-[var(--medical-primary-dark)] font-semibold transition-colors"
            >
              Register
            </button>
          </p>
        </div>
      </MedicalCard>
    </div>
  );
}
