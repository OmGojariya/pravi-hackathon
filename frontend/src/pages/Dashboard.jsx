import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { StatCard } from '../components/common/StatCard';
import {
  Layers,
  CheckCircle2,
  Wrench,
  AlertOctagon,
  Calendar,
  Clock,
  Hammer,
  Archive,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  ClipboardList,
  Plus,
  Coins,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, chartRes, alertRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/charts'),
          api.get('/dashboard/alerts'),
        ]);

        if (sumRes.success) setSummary(sumRes.data);
        if (chartRes.success) setCharts(chartRes.data);
        if (alertRes.success) setAlerts(alertRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const CONDITION_COLORS = {
    EXCELLENT: '#10b981', // Emerald
    GOOD: '#22c55e',      // Green
    FAIR: '#f59e0b',      // Amber
    POOR: '#f97316',      // Orange
    CRITICAL: '#ef4444',  // Red
  };

  const PRIORITY_COLORS = {
    LOW: '#64748b',
    MEDIUM: '#3b82f6',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-xl"></div>
          <div className="h-80 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
            Infrastructure Asset Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time condition, operational lifecycle, maintenance expenditure, and risk telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/assets/map"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>Open Asset Map</span>
          </Link>
          <Link
            to="/assets/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-500 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </Link>
        </div>
      </div>

      {/* Critical Dashboard Alerts Section (Requirement #45) */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Priority Alerts Requiring Attention ({alerts.length})</span>
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 shadow-sm transition-all ${
                  alert.level === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : alert.level === 'HIGH'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold leading-tight">{alert.title}</div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{alert.message}</p>
                </div>
                {alert.link && (
                  <Link
                    to={alert.link}
                    className="p-1 rounded-lg hover:bg-white/80 transition-colors text-slate-700"
                    title="View asset details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8 Primary Dashboard KPI Cards (Requirement #6) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Assets"
          value={summary?.totalAssets || 0}
          subtitle="Registered infrastructure assets"
          icon={Layers}
          color="blue"
        />
        <StatCard
          title="Operational"
          value={summary?.operationalAssets || 0}
          subtitle="In active public service"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Under Maintenance"
          value={summary?.maintenanceAssets || 0}
          subtitle="Repairs or overhauls underway"
          icon={Wrench}
          color="amber"
        />
        <StatCard
          title="Critical Assets"
          value={summary?.criticalAssets || 0}
          subtitle="High risk or critical condition"
          icon={AlertOctagon}
          color="rose"
        />
        <StatCard
          title="Inspection Due"
          value={summary?.overdueInspections || 0}
          subtitle="Overdue or due this cycle"
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="Maintenance Due"
          value={summary?.overdueMaintenance || 0}
          subtitle="Overdue scheduled work"
          icon={Clock}
          color="rose"
        />
        <StatCard
          title="Under Construction"
          value={summary?.underConstruction || 0}
          subtitle="Active infrastructure projects"
          icon={Hammer}
          color="indigo"
        />
        <StatCard
          title="Decommissioned"
          value={summary?.decommissionedAssets || 0}
          subtitle="Retired or disposed inventory"
          icon={Archive}
          color="purple"
        />
      </div>

      {/* Financial Overview Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/30">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Lifecycle Portfolio Valuation</span>
            <div className="text-2xl font-bold tracking-tight text-white font-sans mt-0.5">
              {formatCurrency(summary?.totalLifecycleValue)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Cumulative Acquisition</span>
            <div className="text-sm font-bold text-slate-100 mt-0.5">
              {formatCurrency(summary?.totalAcquisitionValue)}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Maintenance Spend</span>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              {formatCurrency(summary?.totalMaintenanceExpenditure)}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Condition Distribution (Requirement #6) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Asset Condition Rating Distribution</h3>
              <p className="text-xs text-slate-500">EXCELLENT • GOOD • FAIR • POOR • CRITICAL</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.byCondition || []}
                  dataKey="count"
                  nameKey="rating"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={3}
                  label={({ rating, count }) => `${rating}: ${count}`}
                >
                  {(charts?.byCondition || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CONDITION_COLORS[entry.rating] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Assets by Category (Requirement #6) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Assets by Infrastructure Category</h3>
              <p className="text-xs text-slate-500">Roads, Bridges, Water, Electrical, Drainage, etc.</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.byCategory || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0270c5" radius={[4, 4, 0, 0]} name="Asset Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Maintenance Requests by Priority (Requirement #6) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Maintenance Request Priority Breakdown</h3>
              <p className="text-xs text-slate-500">LOW, MEDIUM, HIGH, and CRITICAL work orders</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.maintenanceByPriority || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                  {(charts?.maintenanceByPriority || []).map((entry, index) => (
                    <Cell key={`pri-${index}`} fill={PRIORITY_COLORS[entry.priority] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Assets by Department (Requirement #6) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Asset Ownership by Directorate</h3>
              <p className="text-xs text-slate-500">Distribution across municipal and state departments</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts?.byDepartment || []}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 9 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} name="Assigned Assets" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
