import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConditionBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  ShieldAlert,
} from 'lucide-react';

export const InspectionsList = () => {
  const { hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const isDueFilter = searchParams.get('due') === 'true';

  const [inspections, setInspections] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterRating, setFilterRating] = useState('');

  // New Inspection Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    assetId: '',
    inspectionType: 'Routine',
    conditionScore: 85,
    observations: '',
    recommendations: '',
    nextInspectionDate: '',
  });

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inspections', {
        params: {
          inspectionType: filterType,
          conditionRating: filterRating,
        },
      });
      if (res.success) {
        setInspections(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
    const fetchAssets = async () => {
      try {
        const res = await api.get('/assets', { params: { limit: 100 } });
        if (res.success) setAssets(res.data || []);
      } catch (e) {}
    };
    fetchAssets();
  }, [filterType, filterRating]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assetId) {
      alert('Please select an infrastructure asset.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/inspections', form);
      setModalOpen(false);
      setForm({
        assetId: '',
        inspectionType: 'Routine',
        conditionScore: 85,
        observations: '',
        recommendations: '',
        nextInspectionDate: '',
      });
      fetchInspections();
    } catch (err) {
      alert(err.message || 'Failed to record inspection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
            {isDueFilter ? 'Overdue & Upcoming Inspections' : 'Asset Quality & Safety Inspections'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Certified technical field audits, structural condition assessments, and compliance ratings.
          </p>
        </div>

        {hasRole('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'INSPECTOR', 'FIELD_ENGINEER') && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Perform Field Inspection</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
        >
          <option value="">All Inspection Types</option>
          <option value="Routine">Routine</option>
          <option value="Safety">Safety</option>
          <option value="Structural">Structural</option>
          <option value="Emergency">Emergency</option>
          <option value="Annual">Annual</option>
          <option value="Post-Maintenance">Post-Maintenance</option>
        </select>

        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
        >
          <option value="">All Condition Ratings</option>
          <option value="EXCELLENT">Excellent (90-100)</option>
          <option value="GOOD">Good (75-89)</option>
          <option value="FAIR">Fair (50-74)</option>
          <option value="POOR">Poor (25-49)</option>
          <option value="CRITICAL">Critical (0-24)</option>
        </select>

        <span className="ml-auto text-slate-400 font-medium">
          Total Recorded: <strong>{inspections.length}</strong>
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Inspection ID</th>
                <th className="px-4 py-3">Target Asset</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Condition Rating</th>
                <th className="px-4 py-3">Observations</th>
                <th className="px-4 py-3">Inspector</th>
                <th className="px-4 py-3">Inspection Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Loading inspection records...
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No inspections matching filter.
                  </td>
                </tr>
              ) : (
                inspections.map((insp) => (
                  <tr key={insp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-brand-700 whitespace-nowrap">
                      {insp.inspectionId}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/assets/${insp.assetId?.assetCode}`}
                        className="font-semibold text-slate-900 hover:text-brand-600 block line-clamp-1"
                      >
                        {insp.assetId?.name}
                      </Link>
                      <span className="text-[11px] font-mono text-slate-500">
                        {insp.assetId?.assetCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[11px]">
                        {insp.inspectionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ConditionBadge rating={insp.conditionRating} score={insp.conditionScore} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="line-clamp-2 max-w-sm text-slate-600">{insp.observations}</p>
                      {insp.recommendations && (
                        <p className="line-clamp-1 text-[11px] text-slate-400 mt-0.5">
                          Rec: {insp.recommendations}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{insp.inspectorId?.name || 'Assigned Officer'}</div>
                      <div className="text-[10px] text-slate-400">{insp.inspectorId?.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {new Date(insp.inspectionDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Inspection Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Conduct New Technical Inspection">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Infrastructure Asset *</label>
            <select
              required
              value={form.assetId}
              onChange={(e) => setForm({ ...form, assetId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Select Asset to Inspect</option>
              {assets.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.assetCode} – {a.name} ({a.location?.district})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inspection Type</label>
              <select
                value={form.inspectionType}
                onChange={(e) => setForm({ ...form, inspectionType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Routine">Routine</option>
                <option value="Safety">Safety</option>
                <option value="Structural">Structural</option>
                <option value="Emergency">Emergency</option>
                <option value="Annual">Annual</option>
                <option value="Post-Maintenance">Post-Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assessed Condition Score (0-100) *</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={form.conditionScore}
                onChange={(e) => setForm({ ...form, conditionScore: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detailed Technical Observations *</label>
            <textarea
              required
              rows={3}
              placeholder="Record structural defects, cracking, vibration, corrosion, hydraulic flow..."
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Recommended Remedial Actions</label>
            <input
              type="text"
              placeholder="e.g. Schedule immediate desilting or bearing lubrication"
              value={form.recommendations}
              onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Next Follow-up Inspection Date</label>
            <input
              type="date"
              value={form.nextInspectionDate}
              onChange={(e) => setForm({ ...form, nextInspectionDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3 py-2 border rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold"
            >
              {submitting ? 'Certifying...' : 'Certify & Update Asset Condition'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
