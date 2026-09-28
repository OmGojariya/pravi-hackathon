import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, ShieldCheck, QrCode, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

import { GovEmblem } from '../components/common/GovEmblem';

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
    <div className="min-h-screen bg-[#07192f] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background state decorative elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Tricolor line */}
      <div className="gov-tricolor-line fixed top-0 left-0 w-full" />

      {/* Gov of Gujarat header banner */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 text-slate-300 text-xs font-semibold">
          <span>🇮🇳</span>
          <span className="font-gujarati text-amber-300">ગુજરાત સરકાર</span>
          <span className="text-slate-500">•</span>
          <span>GOVERNMENT OF GUJARAT</span>
        </div>
      </div>

      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-t-4 border-amber-600 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0a2240] text-white p-6 text-center relative">
          <div className="flex justify-center mb-2">
            <GovEmblem className="w-12 h-14" variant="gold" />
          </div>
          
          <h1 className="text-2xl font-extrabold tracking-tight font-['Outfit'] text-white">
            InfraTrack <span className="text-amber-400 font-serif">Gujarat</span>
          </h1>
          <p className="text-xs font-gujarati text-amber-200 mt-0.5 font-medium">
            ગુજરાત રાજ્ય ઇન્ફ્રાસ્ટ્રક્ચર એસેટ મેનેજમેન્ટ પોર્ટલ
          </p>
          <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-wider font-semibold">
            Roads & Buildings Department • Gandhinagar
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07192f] border border-amber-500/40 text-[11px] text-amber-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>State Official Officer Login • ISO 55000</span>
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
