import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { generateOtpCode, sendRealOtpEmail } from '../utils/otpService';

export default function AuthPage({ isRegister = false, navigateTo }) {
  const { login, loginWithOtp, register, resetPassword, socialLogin } = useAuth();
  const { showToast } = useToast();

  // Active view tab: 'login' | 'otp-login' | 'register' | 'forgot'
  const [activeTab, setActiveTab] = useState(isRegister ? 'register' : 'login');

  // Show / Hide Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 1. Password Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 2. OTP Quick Login Form State
  const [otpLoginTarget, setOtpLoginTarget] = useState('');
  const [otpLoginStep, setOtpLoginStep] = useState(1); // 1: Enter Email/Mobile, 2: Enter OTP
  const [otpLoginCode, setOtpLoginCode] = useState('');
  const [generatedOtpLoginCode, setGeneratedOtpLoginCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpPreviewUrl, setOtpPreviewUrl] = useState('');

  // 3. Multi-Step Registration State (1: Details, 2: OTP, 3: Password)
  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [generatedRegOtp, setGeneratedRegOtp] = useState('');
  const [enteredRegOtp, setEnteredRegOtp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regErrors, setRegErrors] = useState({});

  // 4. Forgot / Reset Password State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Enter ID, 2: Verify OTP & New Password
  const [generatedForgotOtp, setGeneratedForgotOtp] = useState('');
  const [enteredForgotOtp, setEnteredForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password strength meter calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak ⚠️', color: '#EF4444' };
    if (score <= 3) return { score: 60, label: 'Fair ⚡', color: '#F59E0B' };
    if (score <= 4) return { score: 85, label: 'Strong 🛡️', color: '#10B981' };
    return { score: 100, label: 'Excellent 🔒', color: '#059669' };
  };

  // Timer countdown hook for OTP
  useEffect(() => {
    let timerId;
    if ((otpLoginStep === 2 || regStep === 2 || forgotStep === 2) && otpTimer > 0) {
      timerId = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(timerId);
  }, [otpLoginStep, regStep, forgotStep, otpTimer]);

  // Handle Password Login Submit
  const handlePasswordLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your registered email address or 10-digit mobile number.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    const res = login(loginIdentifier, loginPassword);
    if (res.success) {
      navigateTo('products');
    } else {
      setLoginError(res.message || 'Invalid login details.');
    }
  };

  // Handle OTP Quick Login Step 1: Send Real Email/Mobile OTP
  const handleSendOtpLogin = async (e) => {
    e.preventDefault();
    const cleanTarget = otpLoginTarget.trim();

    if (!cleanTarget) {
      showToast('Please enter your email address or 10-digit mobile number.', 'error');
      return;
    }

    setIsSendingOtp(true);
    const code = generateOtpCode();
    setGeneratedOtpLoginCode(code);
    setOtpLoginCode('');
    setOtpTimer(60);

    // Dispatch real email OTP if email is provided
    const targetEmail = cleanTarget.includes('@') ? cleanTarget : `${cleanTarget}@desimart.in`;
    const res = await sendRealOtpEmail(targetEmail, code, 'User');
    setIsSendingOtp(false);
    if (res?.previewUrl) setOtpPreviewUrl(res.previewUrl);

    setOtpLoginStep(2);
    showToast(res.message, 'success');
  };

  // Handle OTP Quick Login Step 2: Verify & Login
  const handleVerifyOtpLogin = (e) => {
    e.preventDefault();
    if (otpLoginCode.trim() !== generatedOtpLoginCode) {
      showToast('Invalid OTP verification code. Please check your email and try again.', 'error');
      return;
    }
    loginWithOtp(otpLoginTarget);
    navigateTo('products');
  };

  // Handle Signup Step 1: Send Real Email OTP
  const handleSendRegOtp = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!regName.trim()) errors.name = true;
    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errors.email = true;
    if (!regMobile.trim() || !/^\d{10}$/.test(regMobile)) errors.mobile = true;

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      showToast('Please correct the highlighted fields.', 'error');
      return;
    }

    setIsSendingOtp(true);
    const code = generateOtpCode();
    setGeneratedRegOtp(code);
    setEnteredRegOtp('');
    setOtpTimer(60);
    setRegErrors({});

    const res = await sendRealOtpEmail(regEmail, code, regName);
    setIsSendingOtp(false);
    if (res?.previewUrl) setOtpPreviewUrl(res.previewUrl);

    setRegStep(2);
    showToast(res.message, 'success');
  };

  // Handle Signup Step 2: Verify OTP
  const handleVerifyRegOtp = (e) => {
    e.preventDefault();
    if (enteredRegOtp.trim() !== generatedRegOtp) {
      setRegErrors({ otp: true });
      showToast('Invalid OTP verification code. Please enter the code sent to your email.', 'error');
      return;
    }

    setRegErrors({});
    setRegStep(3);
    showToast('OTP verified! Now set a strong password for your account.', 'success');
  };

  // Handle Signup Step 3: Complete Account
  const handleFinalizeRegister = (e) => {
    e.preventDefault();
    const errors = {};

    if (!regPassword || regPassword.length < 6) errors.password = true;
    if (regPassword !== confirmPassword) errors.confirmPassword = true;

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      showToast('Password must be at least 6 characters and match confirmation.', 'error');
      return;
    }

    const res = register(regName, regEmail, regPassword, regMobile);
    if (res.success) {
      navigateTo('products');
    }
  };

  // Handle Forgot Password Step 1: Send Real Reset OTP
  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    const cleanId = forgotIdentifier.trim();

    if (!cleanId) {
      showToast('Please enter your registered email address or mobile number.', 'error');
      return;
    }

    setIsSendingOtp(true);
    const code = generateOtpCode();
    setGeneratedForgotOtp(code);
    setEnteredForgotOtp('');
    setOtpTimer(60);

    const targetEmail = cleanId.includes('@') ? cleanId : `${cleanId}@desimart.in`;
    const res = await sendRealOtpEmail(targetEmail, code, 'Customer');
    setIsSendingOtp(false);
    if (res?.previewUrl) setOtpPreviewUrl(res.previewUrl);

    setForgotStep(2);
    showToast(res.message, 'success');
  };

  // Handle Forgot Password Step 2: Set New Password
  const handleFinalizeResetPassword = (e) => {
    e.preventDefault();
    if (enteredForgotOtp.trim() !== generatedForgotOtp) {
      showToast('Invalid OTP code. Please enter the code sent to your email.', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    const res = resetPassword(forgotIdentifier, newPassword);
    if (res.success) {
      setActiveTab('login');
      setLoginIdentifier(forgotIdentifier);
      setForgotStep(1);
    }
  };

  // Handle Social Google Sign-in
  const handleGoogleSignIn = async () => {
    const res = await socialLogin('Google');
    if (res?.success) {
      navigateTo('products');
    }
  };

  const regStrength = getPasswordStrength(regPassword);
  const resetStrength = getPasswordStrength(newPassword);

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-card">
        {/* Header Bar */}
        <div className="auth-modal-header">
          <div className="auth-modal-header-title">
            <span style={{ fontSize: '1.2rem' }}>🔑</span>
            <span>
              {activeTab === 'login' && 'Sign In / Log In'}
              {activeTab === 'otp-login' && 'Quick Real OTP Login'}
              {activeTab === 'register' && 'Create Account'}
              {activeTab === 'forgot' && 'Reset Password'}
            </span>
          </div>
          <button
            className="auth-modal-close-btn"
            onClick={() => navigateTo('home')}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="auth-modal-body">
          {/* Main Segmented Navigation Track */}
          <div className="auth-tab-track">
            <button
              className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
            >
              Password Login
            </button>

            <button
              className={`auth-tab-btn ${activeTab === 'otp-login' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('otp-login');
                setOtpLoginStep(1);
              }}
            >
              ⚡ Real OTP Login
            </button>

            <button
              className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('register');
                setRegStep(1);
                setRegErrors({});
              }}
            >
              Sign Up
            </button>
          </div>

          {/* GOOGLE SOCIAL SIGN-IN BUTTON */}
          {(activeTab === 'login' || activeTab === 'register') && (
            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="google-social-btn"
                onClick={handleGoogleSignIn}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>

              <div className="auth-divider">
                <span>OR CONTINUE WITH EMAIL / MOBILE</span>
              </div>
            </div>
          )}

          {/* 1. PASSWORD LOGIN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handlePasswordLoginSubmit} noValidate style={{ marginTop: '12px' }}>
              <div className="auth-form-heading">Welcome back to DesiMart</div>
              <p className="auth-form-subheading">
                Enter your credentials to access your orders, express checkout &amp; member deals.
              </p>

              {loginError && (
                <div className="auth-error-banner">
                  ⚠️ {loginError}
                </div>
              )}

              <div className="form-group">
                <label className="auth-input-label">Email Address or Mobile Number</label>
                <input
                  type="text"
                  className="auth-mint-input"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. maitysonu980@gmail.com or 9876543210"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="auth-input-label">Password</label>
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => {
                      setActiveTab('forgot');
                      setForgotStep(1);
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="password-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-mint-input"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                Sign In to Account →
              </button>

              <div className="auth-footer-prompt">
                <span>Don't have an account?</span>{' '}
                <button
                  type="button"
                  className="auth-link-action"
                  onClick={() => setActiveTab('register')}
                >
                  Create Account Now
                </button>
              </div>
            </form>
          )}

          {/* 2. OTP QUICK LOGIN TAB */}
          {activeTab === 'otp-login' && (
            <div style={{ marginTop: '14px' }}>
              {otpLoginStep === 1 ? (
                <form onSubmit={handleSendOtpLogin}>
                  <div className="auth-form-heading">Passwordless Real OTP Login</div>
                  <p className="auth-form-subheading">
                    Enter your email address or 10-digit mobile number to receive a real 6-digit OTP.
                  </p>

                  <div className="form-group">
                    <label className="auth-input-label">Email Address or Mobile Number</label>
                    <input
                      type="text"
                      className="auth-mint-input"
                      value={otpLoginTarget}
                      onChange={(e) => setOtpLoginTarget(e.target.value)}
                      placeholder="e.g. maitysonu980@gmail.com or 9876543210"
                    />
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={isSendingOtp}>
                    {isSendingOtp ? 'Sending Real OTP...' : 'Send 6-Digit Real OTP Code →'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpLogin}>
                  <div className="auth-form-heading">Verify Real OTP Code</div>
                  <p className="auth-form-subheading">
                    We dispatched a 6-digit verification code to <strong>{otpLoginTarget}</strong>
                  </p>

                  {/* Clean Real OTP Dispatch Info Box (No demo codes shown) */}
                  <div className="otp-sent-info-box">
                    <div style={{ width: '100%' }}>
                      <div>📧 Real OTP code sent to <strong>{otpLoginTarget}</strong>. Please check your Email Inbox &amp; Spam folder.</div>
                      {otpPreviewUrl && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #A7F3D0' }}>
                          📩 <a href={otpPreviewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#15803D', fontWeight: 800, textDecoration: 'underline' }}>
                            Click here to Open Real Delivered Email Inbox ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="auth-input-label">Enter 6-Digit OTP Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      className="auth-mint-input otp-digit-input"
                      value={otpLoginCode}
                      onChange={(e) => setOtpLoginCode(e.target.value)}
                      placeholder="Enter 6-digit code (e.g. 583921)"
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : "Didn't receive code?"}
                    </span>
                    <button
                      type="button"
                      className="otp-resend-btn"
                      disabled={otpTimer > 0 || isSendingOtp}
                      onClick={async () => {
                        setIsSendingOtp(true);
                        const code = generateOtpCode();
                        setGeneratedOtpLoginCode(code);
                        setOtpTimer(60);

                        const targetEmail = otpLoginTarget.includes('@') ? otpLoginTarget : `${otpLoginTarget}@desimart.in`;
                        const res = await sendRealOtpEmail(targetEmail, code, 'User');
                        setIsSendingOtp(false);
                        showToast(res.message, 'success');
                      }}
                    >
                      Resend OTP Code
                    </button>
                  </div>

                  <button type="submit" className="auth-submit-btn">
                    Verify &amp; Sign In →
                  </button>

                  <div className="auth-footer-prompt">
                    <button
                      type="button"
                      className="auth-link-action"
                      onClick={() => setOtpLoginStep(1)}
                    >
                      ← Back to enter number/email
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 3. MULTI-STEP SIGN UP TAB */}
          {activeTab === 'register' && (
            <div style={{ marginTop: '14px' }}>
              {/* Step indicator */}
              <div className="signup-step-stepper">
                <div className={`step-pill ${regStep >= 1 ? 'active' : ''}`}>1. Details</div>
                <div className="step-line"></div>
                <div className={`step-pill ${regStep >= 2 ? 'active' : ''}`}>2. Real OTP</div>
                <div className="step-line"></div>
                <div className={`step-pill ${regStep >= 3 ? 'active' : ''}`}>3. Password</div>
              </div>

              {/* STEP 1: Enter Name, Email & Mobile */}
              {regStep === 1 && (
                <form onSubmit={handleSendRegOtp} noValidate>
                  <div className="auth-form-heading">Create your DesiMart Account</div>
                  <p className="auth-form-subheading">
                    Join DesiMart to unlock exclusive member discounts and express checkout.
                  </p>

                  <div className={`form-group ${regErrors.name ? 'invalid' : ''}`}>
                    <label className="auth-input-label">Full Name</label>
                    <input
                      type="text"
                      className="auth-mint-input"
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        setRegErrors((prev) => ({ ...prev, name: false }));
                      }}
                      placeholder="e.g. Rahul Sharma"
                    />
                    <div className="error-msg">Please enter your full name.</div>
                  </div>

                  <div className={`form-group ${regErrors.email ? 'invalid' : ''}`}>
                    <label className="auth-input-label">Email Address (for Real OTP)</label>
                    <input
                      type="email"
                      className="auth-mint-input"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        setRegErrors((prev) => ({ ...prev, email: false }));
                      }}
                      placeholder="e.g. maitysonu980@gmail.com"
                    />
                    <div className="error-msg">Enter a valid email address.</div>
                  </div>

                  <div className={`form-group ${regErrors.mobile ? 'invalid' : ''}`}>
                    <label className="auth-input-label">Mobile Number</label>
                    <input
                      type="tel"
                      className="auth-mint-input"
                      value={regMobile}
                      onChange={(e) => {
                        setRegMobile(e.target.value);
                        setRegErrors((prev) => ({ ...prev, mobile: false }));
                      }}
                      placeholder="e.g. 9876543210"
                    />
                    <div className="error-msg">Enter a valid 10-digit mobile number.</div>
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={isSendingOtp}>
                    {isSendingOtp ? 'Sending Real Email OTP...' : 'Send Verification OTP →'}
                  </button>

                  <div className="auth-footer-prompt">
                    <span>Already have an account?</span>{' '}
                    <button
                      type="button"
                      className="auth-link-action"
                      onClick={() => setActiveTab('login')}
                    >
                      Sign In here
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Verify Real OTP */}
              {regStep === 2 && (
                <form onSubmit={handleVerifyRegOtp} noValidate>
                  <div className="auth-form-heading">Verify Contact Details</div>
                  <p className="auth-form-subheading">
                    We dispatched a 6-digit code to <strong>{regEmail}</strong> / <strong>{regMobile}</strong>
                  </p>

                  <div className="otp-sent-info-box">
                    <div style={{ width: '100%' }}>
                      <div>📧 Real OTP code sent to <strong>{regEmail}</strong>. Check your Email Inbox &amp; Spam folder.</div>
                      {otpPreviewUrl && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #A7F3D0' }}>
                          📩 <a href={otpPreviewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#15803D', fontWeight: 800, textDecoration: 'underline' }}>
                            Click here to Open Real Delivered Email Inbox ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`form-group ${regErrors.otp ? 'invalid' : ''}`}>
                    <label className="auth-input-label">Enter 6-Digit OTP Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      className="auth-mint-input otp-digit-input"
                      value={enteredRegOtp}
                      onChange={(e) => {
                        setEnteredRegOtp(e.target.value);
                        setRegErrors((prev) => ({ ...prev, otp: false }));
                      }}
                      placeholder="Enter 6-digit code"
                      autoFocus
                    />
                    <div className="error-msg">Invalid OTP verification code. Please check your email.</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : "Didn't receive code?"}
                    </span>
                    <button
                      type="button"
                      className="otp-resend-btn"
                      disabled={otpTimer > 0 || isSendingOtp}
                      onClick={async () => {
                        setIsSendingOtp(true);
                        const code = generateOtpCode();
                        setGeneratedRegOtp(code);
                        setOtpTimer(60);

                        const res = await sendRealOtpEmail(regEmail, code, regName);
                        setIsSendingOtp(false);
                        showToast(res.message, 'success');
                      }}
                    >
                      Resend Code
                    </button>
                  </div>

                  <button type="submit" className="auth-submit-btn">
                    Verify OTP →
                  </button>

                  <div className="auth-footer-prompt">
                    <button
                      type="button"
                      className="auth-link-action"
                      onClick={() => setRegStep(1)}
                    >
                      ← Back to details
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Set Password & Finish */}
              {regStep === 3 && (
                <form onSubmit={handleFinalizeRegister} noValidate>
                  <div className="auth-form-heading">Set Password &amp; Complete</div>
                  <p className="auth-form-subheading">
                    Create a secure password for <strong>{regEmail}</strong>
                  </p>

                  <div className={`form-group ${regErrors.password ? 'invalid' : ''}`}>
                    <label className="auth-input-label">Create Password</label>
                    <div className="password-input-wrap">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        className="auth-mint-input"
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          setRegErrors((prev) => ({ ...prev, password: false }));
                        }}
                        placeholder="At least 6 characters"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                      >
                        {showRegPassword ? '🙈' : '👁️'}
                      </button>
                    </div>

                    {/* Dynamic Password Strength Indicator */}
                    {regPassword && (
                      <div className="password-strength-container">
                        <div className="password-strength-track">
                          <div
                            className="password-strength-fill"
                            style={{
                              width: `${regStrength.score}%`,
                              backgroundColor: regStrength.color
                            }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: regStrength.color }}>
                          Strength: {regStrength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={`form-group ${regErrors.confirmPassword ? 'invalid' : ''}`}>
                    <label className="auth-input-label">Confirm Password</label>
                    <div className="password-input-wrap">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="auth-mint-input"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setRegErrors((prev) => ({ ...prev, confirmPassword: false }));
                        }}
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <div className="error-msg">Passwords do not match.</div>
                  </div>

                  <button type="submit" className="auth-submit-btn">
                    Complete Account Creation 🎉
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 4. FORGOT / RESET PASSWORD TAB */}
          {activeTab === 'forgot' && (
            <div style={{ marginTop: '14px' }}>
              {forgotStep === 1 ? (
                <form onSubmit={handleSendForgotOtp}>
                  <div className="auth-form-heading">Reset Account Password</div>
                  <p className="auth-form-subheading">
                    Enter your email or mobile to receive a 6-digit password reset OTP.
                  </p>

                  <div className="form-group">
                    <label className="auth-input-label">Email Address or Mobile Number</label>
                    <input
                      type="text"
                      className="auth-mint-input"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. maitysonu980@gmail.com"
                    />
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={isSendingOtp}>
                    {isSendingOtp ? 'Sending Reset Code...' : 'Send Reset Code →'}
                  </button>

                  <div className="auth-footer-prompt">
                    <button
                      type="button"
                      className="auth-link-action"
                      onClick={() => setActiveTab('login')}
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleFinalizeResetPassword}>
                  <div className="auth-form-heading">Enter Reset Code &amp; New Password</div>
                  <p className="auth-form-subheading">
                    OTP dispatched to <strong>{forgotIdentifier}</strong>
                  </p>

                  <div className="otp-sent-info-box">
                    <div style={{ width: '100%' }}>
                      <div>📧 Reset OTP sent to <strong>{forgotIdentifier}</strong>. Check your Email Inbox &amp; Spam folder.</div>
                      {otpPreviewUrl && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #A7F3D0' }}>
                          📩 <a href={otpPreviewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#15803D', fontWeight: 800, textDecoration: 'underline' }}>
                            Click here to Open Real Delivered Email Inbox ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="auth-input-label">Enter 6-Digit Reset OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      className="auth-mint-input otp-digit-input"
                      value={enteredForgotOtp}
                      onChange={(e) => setEnteredForgotOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label className="auth-input-label">New Password</label>
                    <input
                      type="password"
                      className="auth-mint-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                    />
                    {newPassword && (
                      <div className="password-strength-container">
                        <div className="password-strength-track">
                          <div
                            className="password-strength-fill"
                            style={{ width: `${resetStrength.score}%`, backgroundColor: resetStrength.color }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: resetStrength.color }}>
                          {resetStrength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="auth-input-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="auth-mint-input"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <button type="submit" className="auth-submit-btn">
                    Reset Password &amp; Sign In →
                  </button>

                  <div className="auth-footer-prompt">
                    <button
                      type="button"
                      className="auth-link-action"
                      onClick={() => setForgotStep(1)}
                    >
                      ← Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
