import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  MapPin,
  ShieldCheck,
  Users,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface LoginSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (role: 'user' | 'admin') => void;
  initialMode?: 'select' | 'user' | 'admin';
}

export const LoginSelectionModal: React.FC<LoginSelectionModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'select',
}) => {
  const { login, adminLogin, register, switchDemoUser, location } = useAuth();

  // Mode: 'select' (the 2 options), 'user-login', 'user-register', 'user-forgot', 'admin-login'
  const [mode, setMode] = useState<'select' | 'user-login' | 'user-register' | 'user-forgot' | 'admin-login'>(
    initialMode === 'admin' ? 'admin-login' : initialMode === 'user' ? 'user-login' : 'select'
  );

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('Oakridge Park');

  // Forgot password inputs
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = () => {
    setError(null);
    setResetMessage(null);
    setEmail('');
    setPassword('');
    setResetCode('');
    setNewPassword('');
    setResetStep('request');
  };

  const handleSelectOption = (target: 'user-login' | 'admin-login') => {
    resetFormState();
    setMode(target);
  };

  // User Sign In Submit
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
      onClose();
      if (onLoginSuccess) onLoginSuccess('user');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // User Registration Submit
  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        neighborhood: neighborhood.trim(),
        lat: location.lat,
        lng: location.lng,
      });
      onClose();
      if (onLoginSuccess) onLoginSuccess('user');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Login Submit
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await adminLogin(email.trim(), password);
      onClose();
      if (onLoginSuccess) onLoginSuccess('admin');
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Forgot Password: Request Code
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResetMessage(null);

    try {
      const res = await api.forgotPassword(email.trim());
      setResetMessage(res.message);
      if (res.code) {
        setResetCode(res.code); // Pre-fill in demo for testing ease
      }
      setResetStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  // Forgot Password: Reset with code
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.resetPassword({
        email: email.trim(),
        code: resetCode.trim(),
        newPassword,
      });
      setResetMessage(res.message);
      setTimeout(() => {
        setMode('user-login');
        setPassword('');
        setError(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Demo Persona login helper
  const handleQuickDemo = async (demoEmail: string, role: 'user' | 'admin' = 'user') => {
    setSubmitting(true);
    setError(null);
    try {
      if (role === 'admin') {
        await adminLogin(demoEmail, 'admin123');
        onClose();
        if (onLoginSuccess) onLoginSuccess('admin');
      } else {
        await switchDemoUser(demoEmail);
        onClose();
        if (onLoginSuccess) onLoginSuccess('user');
      }
    } catch (err: any) {
      setError(err.message || 'Demo authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-selection-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            {mode !== 'select' && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('select');
                }}
                className="p-1.5 -ml-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                title="Back to login options"
                aria-label="Back to login options"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              N
            </div>
            <div>
              <h2 id="login-selection-title" className="text-base font-bold text-slate-900 leading-tight">
                {mode === 'select' && 'Select Login Option'}
                {mode === 'user-login' && 'Neighbor Sign In'}
                {mode === 'user-register' && 'Join Your Neighborhood'}
                {mode === 'user-forgot' && 'Reset Your Password'}
                {mode === 'admin-login' && 'Administrator Portal'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {mode === 'select' && 'Choose your access portal to continue'}
                {mode === 'user-login' && 'Access community requests, offers, and chat'}
                {mode === 'user-register' && 'Create your free neighborhood account'}
                {mode === 'user-forgot' && 'Verify your email to create a new password'}
                {mode === 'admin-login' && 'Restricted community moderation & controls'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 1: Two Separate Login Selection Cards                       */}
          {/* ================================================================= */}
          {mode === 'select' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Welcome to <strong>NeighborHelp</strong>. Please select how you want to sign in to the platform:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: User Login Card */}
                <div
                  onClick={() => handleSelectOption('user-login')}
                  className="group cursor-pointer rounded-2xl border-2 border-slate-200 hover:border-emerald-600 p-5 bg-white hover:bg-emerald-50/20 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <Users className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700">
                        Option 1
                      </span>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                        User Login
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        For local residents to post favors, borrow tools, volunteer help, and build neighborhood trust.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all">
                      <span>Enter Neighbor Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Option 2: Admin Login Card */}
                <div
                  onClick={() => handleSelectOption('admin-login')}
                  className="group cursor-pointer rounded-2xl border-2 border-slate-200 hover:border-slate-800 p-5 bg-white hover:bg-slate-50 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                        Option 2
                      </span>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                        Admin Login
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Restricted management console for community safety, user account moderation, and complaint review.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 group-hover:text-slate-950 group-hover:translate-x-0.5 transition-all">
                      <span>Access Admin Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Demo Evaluation Quick Switch Bar */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant 1-Click Evaluation Personas:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('elena@neighborhood.local', 'user')}
                    className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-colors min-h-[44px]"
                  >
                    <div className="text-xs font-bold text-slate-900 truncate">Elena</div>
                    <div className="text-[10px] text-emerald-700">Neighbor (96★)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('marcus@neighborhood.local', 'user')}
                    className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-colors min-h-[44px]"
                  >
                    <div className="text-xs font-bold text-slate-900 truncate">Marcus</div>
                    <div className="text-[10px] text-sky-700">Helper (88★)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('sarah@neighborhood.local', 'user')}
                    className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-colors min-h-[44px]"
                  >
                    <div className="text-xs font-bold text-slate-900 truncate">Sarah</div>
                    <div className="text-[10px] text-emerald-700">Neighbor (98★)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('admin@neighborhood.local', 'admin')}
                    className="p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-left transition-colors min-h-[44px]"
                  >
                    <div className="text-xs font-bold text-white truncate">Administrator</div>
                    <div className="text-[10px] text-emerald-300">Admin Role</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* OPTION 1: USER LOGIN / REGISTER FORM                             */}
          {/* ================================================================= */}
          {(mode === 'user-login' || mode === 'user-register') && (
            <div className="space-y-4">
              {/* Tabs: Sign In / Create Account */}
              <div className="flex border-b border-slate-200 bg-slate-50 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('user-login');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                    mode === 'user-login'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Neighbor Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('user-register');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                    mode === 'user-register'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  New Neighbor Registration
                </button>
              </div>

              <form onSubmit={mode === 'user-login' ? handleUserLogin : handleUserRegister} className="space-y-4">
                {mode === 'user-register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Your Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Jane Doe"
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Neighborhood Area
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={neighborhood}
                          onChange={e => setNeighborhood(e.target.value)}
                          placeholder="e.g. Oakridge Park"
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    {mode === 'user-login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setResetMessage(null);
                          setMode('user-forgot');
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>
                  {mode === 'user-register' && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      At least 6 characters
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all min-h-[44px]"
                >
                  {submitting
                    ? 'Processing...'
                    : mode === 'user-login'
                    ? 'Sign In to Neighbor Dashboard'
                    : 'Create Neighbor Account'}
                </button>
              </form>

              {/* Quick Persona Fill */}
              {mode === 'user-login' && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 mb-2">
                    Quick Demo Neighbor Logins:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('elena@neighborhood.local', 'user')}
                      className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-xs transition-colors min-h-[44px]"
                    >
                      <div className="font-bold text-slate-900">Elena Vance</div>
                      <div className="text-[10px] text-emerald-700">Trusted Neighbor (96★)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('marcus@neighborhood.local', 'user')}
                      className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-xs transition-colors min-h-[44px]"
                    >
                      <div className="font-bold text-slate-900">Marcus Chen</div>
                      <div className="text-[10px] text-sky-700">Reliable Helper (88★)</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* OPTION 1 SUB-FLOW: FORGOT PASSWORD                               */}
          {/* ================================================================= */}
          {mode === 'user-forgot' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Enter your registered account email. A verification code will be generated to reset your password.
                </span>
              </div>

              {resetMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetMessage}</span>
                </div>
              )}

              {resetStep === 'request' ? (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. elena@neighborhood.local"
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('user-login')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[44px]"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all min-h-[44px]"
                    >
                      {submitting ? 'Generating...' : 'Send Verification Code'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={e => setResetCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full px-3.5 py-2.5 text-xs font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900 text-center text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      At least 6 characters
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setResetStep('request')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[44px]"
                    >
                      Resend Code
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all min-h-[44px]"
                    >
                      {submitting ? 'Updating...' : 'Set New Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* OPTION 2: ADMINISTRATOR LOGIN FORM                                */}
          {/* ================================================================= */}
          {mode === 'admin-login' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-start gap-3 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold block text-emerald-300">
                    Restricted Administrator Console
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    This portal is exclusively for verified platform administrators. Public registration is not permitted.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@neighborhood.local"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrator Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all min-h-[44px] flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{submitting ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                </button>
              </form>

              {/* 1-Click Demo Admin Button */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-bold text-slate-500">
                  Pre-configured Demo Administrator:
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin@neighborhood.local', 'admin')}
                  className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-left transition-colors flex items-center justify-between min-h-[44px]"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Community Administrator
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      admin@neighborhood.local · admin123
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    1-Click Sign In
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
