import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Building, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.success) {
        setSubmitted(true);
        if (res.data?.resetToken) {
          setResetToken(res.data.resetToken);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to process password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-xl bg-brand-600 mb-3 text-white">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Reset Your Password</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your official email to receive password recovery instructions.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold">Reset Link Generated</p>
              <p className="text-xs mt-1 text-emerald-700">
                A secure reset token has been dispatched for {email}.
              </p>
            </div>

            {resetToken && (
              <div className="p-3 bg-slate-100 rounded-lg text-left">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Demo Quick Reset Link:</span>
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="block text-xs font-mono text-brand-600 underline mt-1 break-all"
                >
                  Click here to set new password with generated token
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@infratrack.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold shadow transition-colors"
            >
              {loading ? 'Processing...' : 'Send Recovery Link'}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = new URLSearchParams(window.location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Create New Password</h2>
        <p className="text-xs text-slate-500 mb-4">Choose a secure password for your account.</p>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm border border-emerald-200">
              <p className="font-semibold">Password Reset Complete</p>
              <p className="text-xs mt-1">You may now log in with your updated password.</p>
            </div>
            <Link
              to="/login"
              className="inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold shadow transition-colors"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
