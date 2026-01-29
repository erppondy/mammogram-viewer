import { useState } from 'react';
import { authService } from '../services/authService';
import { licenseService } from '../services/licenseService';
import { MedicalButton } from '../components/MedicalUI';
import CustomLoader from '../components/CustomLoader';

interface RegisterPageProps {
  onRegister?: () => void;
  onSwitchToLogin: () => void;
}

interface LicenseDetails {
  ambulanceName: string;
  status: string;
  uploadQuota: number;
  uploadsUsed: number;
}

export default function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    professionalCredentials: '',
    licenseKey: '',
    ambulanceRole: 'operator',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAmbulanceUser, setIsAmbulanceUser] = useState(false);
  const [validatingLicense, setValidatingLicense] = useState(false);
  const [licenseDetails, setLicenseDetails] = useState<LicenseDetails | null>(null);
  const [licenseError, setLicenseError] = useState('');

  const validateLicenseKeyFormat = (key: string): boolean => {
    // Format: AMB-XXXX-XXXX-XXXX-XXXX (20 characters + 4 hyphens)
    const licenseKeyRegex = /^AMB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return licenseKeyRegex.test(key);
  };

  const handleLicenseKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value.toUpperCase();
    setFormData({ ...formData, licenseKey: key });
    setLicenseError('');
    setLicenseDetails(null);

    // Validate format first
    if (key && !validateLicenseKeyFormat(key)) {
      setLicenseError('Invalid license key format. Expected: AMB-XXXX-XXXX-XXXX-XXXX');
      return;
    }

    // If format is valid and complete, validate with backend
    if (key && validateLicenseKeyFormat(key)) {
      setValidatingLicense(true);
      try {
        const validation = await licenseService.validateLicenseKey(key);
        if (validation.isValid && validation.license) {
          setLicenseDetails({
            ambulanceName: validation.license.ambulanceName,
            status: validation.license.status,
            uploadQuota: validation.license.uploadQuota,
            uploadsUsed: validation.license.uploadsUsed,
          });
        } else {
          setLicenseError(validation.error || 'Invalid license key');
        }
      } catch (err: any) {
        setLicenseError(err.response?.data?.error?.message || 'Failed to validate license key');
      } finally {
        setValidatingLicense(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate license key format if provided
    if (isAmbulanceUser && formData.licenseKey) {
      if (!validateLicenseKeyFormat(formData.licenseKey)) {
        setError('Invalid license key format');
        return;
      }
      if (licenseError) {
        setError('Please provide a valid license key');
        return;
      }
    }

    setLoading(true);

    try {
      let response;
      
      if (isAmbulanceUser && formData.licenseKey) {
        // Register as ambulance user
        response = await authService.registerAmbulanceUser({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          professionalCredentials: formData.professionalCredentials || undefined,
          licenseKey: formData.licenseKey,
          ambulanceRole: formData.ambulanceRole,
        });
      } else {
        // Regular registration
        response = await authService.register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          professionalCredentials: formData.professionalCredentials || undefined,
        });
      }

      setSuccess(true);
      setSuccessMessage(response.message || 'Registration successful! Your account is pending approval.');
    } catch (err: any) {
      const errorCode = err.response?.data?.error?.code;
      const errorMessage = err.response?.data?.error?.message;
      
      if (errorCode === 'INVALID_LICENSE_KEY') {
        setError('Invalid license key. Please check and try again.');
      } else if (errorCode === 'LICENSE_EXPIRED') {
        setError('This license has expired. Please contact your administrator.');
      } else if (errorCode === 'LICENSE_REVOKED') {
        setError('This license has been revoked. Please contact your administrator.');
      } else {
        setError(errorMessage || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex items-center justify-center px-4 py-8" style={{ background: '#000000', minHeight: 'calc(100vh - 80px)', flex: 1 }}>
      <div className="card" style={{ padding: '8px', maxWidth: '400px', width: '100%', margin: '2em 0' }}>
        <div className="card2 form" style={{ padding: '0.8em', borderRadius: '12px' }}>
          <p id="heading">Create Account</p>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4">
              <p className="font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </p>
              {/* <p className="text-sm opacity-90 mb-3">
              You will receive an email notification once your account has been approved by an administrator.
            </p> */}
              <MedicalButton
                onClick={onSwitchToLogin}
                variant="secondary"
                fullWidth
              >
                Go to Login
              </MedicalButton>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              {/* Ambulance User Toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAmbulanceUser}
                    onChange={(e) => {
                      setIsAmbulanceUser(e.target.checked);
                      if (!e.target.checked) {
                        setFormData({ ...formData, licenseKey: '', ambulanceRole: 'operator' });
                        setLicenseDetails(null);
                        setLicenseError('');
                      }
                    }}
                    className="w-4 h-4 rounded"
                    style={{
                      accentColor: '#00d4ff',
                    }}
                  />
                  <span className="text-sm" style={{ color: '#a0a0a0' }}>
                    Register as Ambulance User
                  </span>
                </label>
              </div>

              <div className="field">
                <svg className="input-icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                </svg>
                <input
                  type="text"
                  name="fullName"
                  className="input-field"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <svg className="input-icon" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                  <path d="M207.8 20.73c-93.45 18.32-168.7 93.66-187 187.1c-27.64 140.9 68.65 266.2 199.1 285.1c19.01 2.888 36.17-12.26 36.17-31.49l.0001-.6631c0-15.74-11.44-28.88-26.84-31.24c-84.35-12.98-149.2-86.13-149.2-174.2c0-102.9 88.61-185.5 193.4-175.4c91.54 8.869 158.6 91.25 158.6 183.2l0 16.16c0 22.09-17.94 40.05-40 40.05s-40.01-17.96-40.01-40.05v-120.1c0-8.847-7.161-16.02-16.01-16.02l-31.98 .0036c-7.299 0-13.2 4.992-15.12 11.68c-24.85-12.15-54.24-16.38-86.06-5.106c-38.75 13.73-68.12 48.91-73.72 89.64c-9.483 69.01 43.81 128 110.9 128c26.44 0 50.43-9.544 69.59-24.88c24 31.3 65.23 48.69 109.4 37.49C465.2 369.3 496 324.1 495.1 277.2V256.3C495.1 107.1 361.2-9.332 207.8 20.73zM239.1 304.3c-26.47 0-48-21.56-48-48.05s21.53-48.05 48-48.05s48 21.56 48 48.05S266.5 304.3 239.1 304.3z"></path>
                </svg>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <svg className="input-icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                </svg>
                <input
                  type="text"
                  name="professionalCredentials"
                  className="input-field"
                  placeholder="Credentials (Optional)"
                  value={formData.professionalCredentials}
                  onChange={handleChange}
                />
              </div>

              {/* License Key Field - Only shown for ambulance users */}
              {isAmbulanceUser && (
                <>
                  <div className="field">
                    <svg className="input-icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM5 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                    </svg>
                    <input
                      type="text"
                      name="licenseKey"
                      className="input-field"
                      placeholder="License Key (AMB-XXXX-XXXX-XXXX-XXXX)"
                      value={formData.licenseKey}
                      onChange={handleLicenseKeyChange}
                      required={isAmbulanceUser}
                      maxLength={29}
                      style={{
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em',
                      }}
                    />
                    {validatingLicense && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CustomLoader size={16} />
                      </div>
                    )}
                  </div>

                  {/* License Validation Error */}
                  {licenseError && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg mb-3 text-xs">
                      {licenseError}
                    </div>
                  )}

                  {/* License Details - Show when valid */}
                  {licenseDetails && !licenseError && (
                    <div className="bg-green-900/20 border border-green-500/50 text-green-400 px-3 py-2 rounded-lg mb-3 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">Valid License</span>
                      </div>
                      <div className="space-y-1 ml-6">
                        <div>Ambulance: <span className="font-semibold">{licenseDetails.ambulanceName}</span></div>
                        <div>Status: <span className="font-semibold capitalize">{licenseDetails.status}</span></div>
                        <div>Quota: <span className="font-semibold">{licenseDetails.uploadsUsed} / {licenseDetails.uploadQuota}</span> uploads used</div>
                      </div>
                    </div>
                  )}

                  {/* Ambulance Role Selection */}
                  <div className="field">
                    <svg className="input-icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                      <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z" />
                      <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                    </svg>
                    <select
                      name="ambulanceRole"
                      className="input-field"
                      value={formData.ambulanceRole}
                      onChange={handleChange}
                      required={isAmbulanceUser}
                      style={{
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2300d4ff\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem',
                      }}
                    >
                      <option value="operator">Operator</option>
                      <option value="doctor">Doctor</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </>
              )}

              <div className="field">
                <svg className="input-icon" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                  <path d="M80 192V144C80 64.47 144.5 0 224 0C303.5 0 368 64.47 368 144V192H384C419.3 192 448 220.7 448 256V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V256C0 220.7 28.65 192 64 192H80zM144 192H304V144C304 99.82 268.2 64 224 64C179.8 64 144 99.82 144 144V192z"></path>
                </svg>
                <input
                  type="password"
                  name="password"
                  className="input-field"
                  placeholder="Password (min 8 chars)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>

              <div className="field">
                <svg className="input-icon" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                  <path d="M80 192V144C80 64.47 144.5 0 224 0C303.5 0 368 64.47 368 144V192H384C419.3 192 448 220.7 448 256V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V256C0 220.7 28.65 192 64 192H80zM144 192H304V144C304 99.82 268.2 64 224 64C179.8 64 144 99.82 144 144V192z"></path>
                </svg>
                <input
                  type="password"
                  name="confirmPassword"
                  className="input-field"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="btn">
                <button type="submit" className="button2" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <CustomLoader size={16} />
                      Creating...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

              <button
                type="button"
                className="button3"
                onClick={onSwitchToLogin}
                style={{ width: '100%', marginTop: '1em' }}
              >
                Already have an account? Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
