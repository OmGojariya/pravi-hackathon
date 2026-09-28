import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Shield, User, Database, Server, Key, Bell } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit'] flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          <span>System & Operational Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configuration parameters, database connectivity, and profile management.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-600" />
          <span>Active Operator Profile</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Name:</span>
            <div className="font-bold text-slate-900 mt-0.5">{user?.name}</div>
          </div>
          <div>
            <span className="text-slate-400">Employee ID:</span>
            <div className="font-bold font-mono text-slate-900 mt-0.5">{user?.employeeId}</div>
          </div>
          <div>
            <span className="text-slate-400">Role:</span>
            <div className="font-bold font-mono text-brand-700 mt-0.5">{user?.role}</div>
          </div>
          <div>
            <span className="text-slate-400">Department:</span>
            <div className="font-semibold text-slate-900 mt-0.5">{user?.department}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-brand-600" />
          <span>Enterprise System Infrastructure</span>
        </h3>
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <span className="font-semibold text-slate-700">Platform Build</span>
            <span className="font-mono text-slate-600">InfraTrack Enterprise v2.0-GA</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <span className="font-semibold text-slate-700">Database Status</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MongoDB Operational & Indexed</span>
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <span className="font-semibold text-slate-700">Audit Trail Retention</span>
            <span className="font-semibold text-slate-600">Permanent WORM (Write Once, Read Many)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <span className="font-semibold text-slate-700">Asset QR Format</span>
            <span className="font-mono text-slate-600">Base64 PNG 280x280 High-Error-Correction</span>
          </div>
        </div>
      </div>
    </div>
  );
};
