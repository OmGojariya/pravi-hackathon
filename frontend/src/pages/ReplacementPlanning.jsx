import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { PriorityBadge } from '../components/common/Badge';
import {
  CalendarCheck,
  AlertTriangle,
  Plus,
  Repeat,
  CheckCircle2,
  Clock,
  Archive,
  ArrowRight,
} from 'lucide-react';

export const ReplacementPlanning = () => {
  const { hasRole } = useAuth();
  const [plans, setPlans] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    oldAssetId: '',
    replacementReason: '',
    estimatedReplacementCost: 0,
    proposedYear: new Date().getFullYear() + 1,
    priority: 'HIGH',
    notes: '',
  });

  const [executeForm, setExecuteForm] = useState({
    newAssetId: '',
    remarks: 'Commissioned as direct replacement for retired asset',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        api.get('/replacement-plans'),
        api.get('/assets', { params: { limit: 100 } }),
      ]);
      if (pRes.success) setPlans(pRes.data || []);
      if (aRes.success) setAssets(aRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter assets approaching end of useful life (remaining life <= 2 years)
  const now = Date.now();
  const eolAssets = assets.filter((a) => {
    const usefulLife = a.lifecycle?.usefulLife || 30;
    const start = a.lifecycle?.commissioningDate || a.createdAt;
    const age = (now - new Date(start).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return (usefulLife - age) <= 2 && !['DISPOSED', 'DECOMMISSIONED'].includes(a.lifecycle?.status);
  });

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/replacement-plans', form);
      setPlanModalOpen(false);
      setForm({
        oldAssetId: '',
        replacementReason: '',
        estimatedReplacementCost: 0,
        proposedYear: new Date().getFullYear() + 1,
        priority: 'HIGH',
        notes: '',
      });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      await api.post(`/replacement-plans/${selectedPlan._id}/execute`, executeForm);
      setExecuteModalOpen(false);
      setSelectedPlan(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to execute replacement');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => (val ? `₹${val.toLocaleString()}` : '₹0');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
            End-of-Life & Asset Replacement Planning
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Predictive end-of-service alerts and decommission-to-commission replacement workflows (Requirement #29 & #30).
          </p>
        </div>

        {hasRole('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'FINANCE_OFFICER') && (
          <button
            onClick={() => setPlanModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Replacement Plan</span>
          </button>
        )}
      </div>

      {/* Approaching End-of-Life Warning Banner (Requirement #29) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Assets Approaching End of Useful Service Life ({eolAssets.length})</span>
          </span>
          <span className="text-[11px] text-amber-800 font-medium">Remaining useful service &lt; 2 years</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {eolAssets.length === 0 ? (
            <p className="text-xs text-slate-400 col-span-full">No assets currently approaching end of useful service life.</p>
          ) : (
            eolAssets.map((a) => {
              const usefulLife = a.lifecycle?.usefulLife || 30;
              const start = a.lifecycle?.commissioningDate || a.createdAt;
              const age = parseFloat(((now - new Date(start).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));
              const remaining = Math.max(0, parseFloat((usefulLife - age).toFixed(1)));

              return (
                <div key={a._id} className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-800">{a.assetCode}</span>
                      <h4 className="font-bold text-slate-900 line-clamp-1">{a.name}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                      {remaining} YRS LEFT
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 py-1 border-t border-amber-100 text-[11px]">
                    <div><span className="text-slate-500">Age:</span> <strong>{age} yrs</strong></div>
                    <div><span className="text-slate-500">Life:</span> <strong>{usefulLife} yrs</strong></div>
                    <div><span className="text-slate-500">Rating:</span> <strong>{a.condition?.rating}</strong></div>
                  </div>

                  <button
                    onClick={() => {
                      setForm({
                        oldAssetId: a._id,
                        replacementReason: `Asset reached ${age} years of useful life (${remaining} years remaining). Structural depreciation mandate.`,
                        estimatedReplacementCost: a.financial?.acquisitionCost || 10000000,
                        proposedYear: new Date().getFullYear() + 1,
                        priority: 'HIGH',
                        notes: 'End of life decommission plan',
                      });
                      setPlanModalOpen(true);
                    }}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-center text-xs transition-colors"
                  >
                    Initiate Replacement Plan
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Replacement Plans Table (Requirement #30) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Capital Replacement & Rehabilitation Pipeline</h3>
          <span className="text-xs text-slate-500">{plans.length} total registered plans</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Existing Asset (Retiring)</th>
                <th className="px-4 py-3">Replacement Justification</th>
                <th className="px-4 py-3">Proposed Year</th>
                <th className="px-4 py-3">Est. Replacement Cost</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No active replacement plans registered.
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{plan.oldAssetId?.name}</div>
                      <div className="font-mono text-brand-700 font-bold">{plan.oldAssetId?.assetCode}</div>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <div className="line-clamp-2 text-slate-600">{plan.replacementReason}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{plan.proposedYear}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{formatCurrency(plan.estimatedReplacementCost)}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={plan.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        plan.approvalStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800' :
                        plan.approvalStatus === 'APPROVED' ? 'bg-blue-50 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {plan.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {plan.approvalStatus !== 'COMPLETED' ? (
                        <button
                          onClick={() => {
                            setSelectedPlan(plan);
                            setExecuteModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          Execute Replacement
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Executed & Retired</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create Plan */}
      <Modal isOpen={planModalOpen} onClose={() => setPlanModalOpen(false)} title="Formulate Asset Replacement Plan">
        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Retiring Asset *</label>
            <select
              required
              value={form.oldAssetId}
              onChange={(e) => setForm({ ...form, oldAssetId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">Select Asset Approaching End-of-Life</option>
              {assets.map((a) => (<option key={a._id} value={a._id}>{a.assetCode} – {a.name}</option>))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Replacement / Decommission *</label>
            <textarea
              required
              rows={2}
              value={form.replacementReason}
              onChange={(e) => setForm({ ...form, replacementReason: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estimated Cost (₹ INR)</label>
              <input
                type="number"
                value={form.estimatedReplacementCost}
                onChange={(e) => setForm({ ...form, estimatedReplacementCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Proposed Execution Year</label>
              <input
                type="number"
                value={form.proposedYear}
                onChange={(e) => setForm({ ...form, proposedYear: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPlanModalOpen(false)} className="px-3 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold">
              {submitting ? 'Recording...' : 'Register Plan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Execute Replacement (Requirement #30: old -> DISPOSED, new -> COMMISSIONED) */}
      <Modal isOpen={executeModalOpen} onClose={() => setExecuteModalOpen(false)} title="Execute Asset Replacement">
        <form onSubmit={handleExecute} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Asset to Decommission:</span>
            <div className="font-bold text-sm text-slate-900 mt-0.5">{selectedPlan?.oldAssetId?.name} ({selectedPlan?.oldAssetId?.assetCode})</div>
            <p className="text-xs text-rose-700 font-semibold mt-1">Status will transition to: DISPOSED</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Newly Commissioned Asset (Optional)</label>
            <select
              value={executeForm.newAssetId}
              onChange={(e) => setExecuteForm({ ...executeForm, newAssetId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">None (Retire without direct surrogate)</option>
              {assets
                .filter((a) => a._id !== selectedPlan?.oldAssetId?._id)
                .map((a) => (<option key={a._id} value={a._id}>{a.assetCode} – {a.name} ({a.lifecycle?.status})</option>))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Execution Remarks</label>
            <input
              type="text"
              value={executeForm.remarks}
              onChange={(e) => setExecuteForm({ ...executeForm, remarks: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setExecuteModalOpen(false)} className="px-3 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">
              {submitting ? 'Executing...' : 'Complete Replacement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
