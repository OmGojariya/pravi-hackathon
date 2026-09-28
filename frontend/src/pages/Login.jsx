import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, ShieldCheck, QrCode, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { login, loginDemo } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleType) => {
    setError('');
    setLoading(true);
    try {
      await loginDemo(roleType);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to authenticate demo user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-brand-950 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="inline-flex p-3 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 mb-3 shadow-lg shadow-brand-500/30">
            <Building className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight font-['Outfit']">InfraTrack</h1>
          <p className="text-xs text-slate-300 mt-1 uppercase tracking-widest font-semibold">
            Infrastructure Asset Lifecycle System
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>State Enterprise Portal • ISO 55000</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@infratrack.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts for Evaluator */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>Instant Demo Login (1-Click)</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-brand-50 hover:border-brand-300 transition-colors"
              >
                <div className="font-semibold text-slate-800">Administrator</div>
                <div className="text-[10px] text-slate-400">admin@infratrack.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('assetmanager')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-brand-50 hover:border-brand-300 transition-colors"
              >
                <div className="font-semibold text-slate-800">Asset Manager</div>
                <div className="text-[10px] text-slate-400">assetmanager@infratrack.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('engineer')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-brand-50 hover:border-brand-300 transition-colors"
              >
                <div className="font-semibold text-slate-800">Field Engineer</div>
                <div className="text-[10px] text-slate-400">engineer@infratrack.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('viewer')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-brand-50 hover:border-brand-300 transition-colors"
              >
                <div className="font-semibold text-slate-800">Public Viewer</div>
                <div className="text-[10px] text-slate-400">viewer@infratrack.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          InfraTrack Central Government Enterprise Core
        </div>
      </div>
    </div>
  );
};
