import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import {
  Briefcase,
  Plus,
  Building,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const ProjectsList = () => {
  const { hasRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'Highway Corridor Modernization',
    description: '',
    contractor: '',
    budget: 0,
    startDate: '',
    expectedCompletion: '',
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      if (res.success) setProjects(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      setModalOpen(false);
      setForm({
        name: '',
        type: 'Highway Corridor Modernization',
        description: '',
        contractor: '',
        budget: 0,
        startDate: '',
        expectedCompletion: '',
      });
      fetchProjects();
    } catch (err) {
      alert(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
            Capital Infrastructure Projects
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Capital expenditure programs spawning multiple infrastructure assets (Requirement #17).
          </p>
        </div>

        {hasRole('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER') && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Capital Project</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading projects...</div>
        ) : (
          projects.map((prj) => (
            <div
              key={prj._id}
              className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-brand-200 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-brand-700">{prj.projectId}</span>
                    <h3 className="font-bold text-base text-slate-900 mt-0.5 leading-snug">{prj.name}</h3>
                    <span className="text-xs text-slate-500 font-medium">{prj.type}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    prj.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    prj.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {prj.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {prj.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Contractor</span>
                    <span className="font-semibold text-slate-800 truncate block">{prj.contractor || 'L&T Infrastructure'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Capital Budget</span>
                    <span className="font-semibold text-slate-900 font-mono">{formatCurrency(prj.budget)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Disbursed Cost</span>
                    <span className="font-semibold text-emerald-700 font-mono">{formatCurrency(prj.actualCost)}</span>
                  </div>
                </div>

                {/* Linked Assets (Requirement #17: Projects can create multiple assets) */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-brand-600" />
                      <span>Linked Infrastructure Assets ({prj.assetCount || 0})</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {prj.linkedAssets?.length === 0 ? (
                      <span className="text-xs text-slate-400">No assets linked yet</span>
                    ) : (
                      prj.linkedAssets?.map((a) => (
                        <Link
                          key={a._id}
                          to={`/assets/${a.assetCode}`}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-[11px] font-mono font-medium text-slate-700 transition-colors flex items-center gap-1 border border-slate-200"
                        >
                          <span>{a.assetCode}</span>
                          <span className="text-[10px] text-slate-400 font-sans">({a.name.slice(0, 14)}...)</span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Start: {new Date(prj.startDate).toLocaleDateString()}</span>
                <span>Expected: {prj.expectedCompletion ? new Date(prj.expectedCompletion).toLocaleDateString() : 'TBD'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Initialize Capital Infrastructure Project">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ahmedabad Ring Road Expansion"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Type</label>
              <input
                type="text"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prime Contractor</label>
              <input
                type="text"
                placeholder="e.g. Larsen & Toubro"
                value={form.contractor}
                onChange={(e) => setForm({ ...form, contractor: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Allocated Budget (₹ INR)</label>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Commencement Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected Completion</label>
              <input
                type="date"
                value={form.expectedCompletion}
                onChange={(e) => setForm({ ...form, expectedCompletion: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Scope & Charter</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-2 border rounded-lg text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold">
              {submitting ? 'Creating...' : 'Register Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
