import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Wrench,
  FileSpreadsheet,
  Repeat,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

export const MaintenanceList = () => {
  const { hasRole } = useAuth();
  const [subTab, setSubTab] = useState('requests'); // 'requests' | 'work-orders' | 'schedules'
  const [requests, setRequests] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [workOrderModalOpen, setWorkOrderModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [requestForm, setRequestForm] = useState({
    assetId: '',
    problem: '',
    description: '',
    priority: 'MEDIUM',
    maintenanceType: 'Corrective',
    estimatedCost: 0,
  });

  const [workOrderForm, setWorkOrderForm] = useState({
    assetId: '',
    maintenanceRequestId: '',
    maintenanceType: 'Corrective',
    assignedTeam: 'Civil & Electro-Mechanical Squad',
    workDescription: '',
    laborCost: 0,
    materialCost: 0,
    otherCost: 0,
  });

  const [scheduleForm, setScheduleForm] = useState({
    assetId: '',
    title: '',
    frequencyDays: 30,
    nextDueDate: '',
    assignedTeam: 'Routine Preventive Wing',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, woRes, schRes, astRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/work-orders'),
        api.get('/maintenance/schedules'),
        api.get('/assets', { params: { limit: 100 } }),
      ]);
      if (reqRes.success) setRequests(reqRes.data || []);
      if (woRes.success) setWorkOrders(woRes.data || []);
      if (schRes.success) setSchedules(schRes.data || []);
      if (astRes.success) setAssets(astRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/maintenance', requestForm);
      setRequestModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/work-orders', workOrderForm);
      setWorkOrderModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create work order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteWorkOrder = async (id) => {
    if (!window.confirm('Mark this Work Order as COMPLETED? This will commit actual expenditure to the asset lifecycle cost.')) return;
    try {
      await api.put(`/work-orders/${id}`, { status: 'COMPLETED' });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update work order');
    }
  };

  const formatCurrency = (val) => (val ? `₹${val.toLocaleString()}` : '₹0');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
            Maintenance Management & Work Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end ticketing, work orders execution, cost tracking, and recurring preventive maintenance schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'requests' && (
            <button
              onClick={() => setRequestModalOpen(true)}
              className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log Maintenance Request</span>
            </button>
          )}

          {subTab === 'work-orders' && (
            <button
              onClick={() => setWorkOrderModalOpen(true)}
              className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Work Order</span>
            </button>
          )}

          {subTab === 'schedules' && (
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Recurring Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setSubTab('requests')}
          className={`pb-2.5 px-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            subTab === 'requests'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Maintenance Requests ({requests.length})</span>
        </button>

        <button
          onClick={() => setSubTab('work-orders')}
          className={`pb-2.5 px-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            subTab === 'work-orders'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Work Orders ({workOrders.length})</span>
        </button>

        <button
          onClick={() => setSubTab('schedules')}
          className={`pb-2.5 px-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            subTab === 'schedules'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Preventive Schedules ({schedules.length})</span>
        </button>
      </div>

      {/* VIEW 1: REQUESTS */}
      {subTab === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Problem / Scope</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Est. Cost</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((mr) => (
                  <tr key={mr._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{mr.requestId}</td>
                    <td className="px-4 py-3">
                      <Link to={`/assets/${mr.assetId?.assetCode}`} className="font-semibold text-brand-700 hover:underline">
                        {mr.assetId?.name}
                      </Link>
                      <span className="text-[11px] text-slate-400 block font-mono">{mr.assetId?.assetCode}</span>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <div className="font-semibold text-slate-900">{mr.problem}</div>
                      <div className="text-slate-500 text-[11px] truncate">{mr.description}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <PriorityBadge priority={mr.priority} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        mr.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                        mr.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {mr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">{formatCurrency(mr.estimatedCost)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {new Date(mr.requestDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {mr.status !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setWorkOrderForm({
                              assetId: mr.assetId?._id || '',
                              maintenanceRequestId: mr._id,
                              maintenanceType: mr.maintenanceType || 'Corrective',
                              assignedTeam: 'Field Civil Response Unit',
                              workDescription: mr.problem,
                              laborCost: Math.round((mr.estimatedCost || 10000) * 0.4),
                              materialCost: Math.round((mr.estimatedCost || 10000) * 0.5),
                              otherCost: Math.round((mr.estimatedCost || 10000) * 0.1),
                            });
                            setWorkOrderModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-semibold"
                        >
                          Issue Work Order
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: WORK ORDERS */}
      {subTab === 'work-orders' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Work Order ID</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Work Scope</th>
                  <th className="px-4 py-3">Assigned Team</th>
                  <th className="px-4 py-3">Total Cost (Labor+Material+Other)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {workOrders.map((wo) => (
                  <tr key={wo._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-brand-700">{wo.workOrderId}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{wo.assetId?.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{wo.assetId?.assetCode}</div>
                    </td>
                    <td className="px-4 py-3 max-w-sm">{wo.workDescription}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">{wo.assignedTeam}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {formatCurrency(wo.totalCost)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        wo.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {wo.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => handleCompleteWorkOrder(wo._id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                        >
                          Mark Completed
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Finalized</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: PREVENTIVE SCHEDULES */}
      {subTab === 'schedules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((sch) => (
            <div key={sch._id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand-700">{sch.assetId?.assetCode}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  EVERY {sch.frequencyDays} DAYS
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{sch.title}</h4>
              <p className="text-xs text-slate-500">{sch.assetId?.name}</p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-center">
                <span className="text-slate-500">Next Scheduled Run:</span>
                <span className="font-bold text-slate-900">{new Date(sch.nextDueDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Maintenance Request */}
      <Modal isOpen={requestModalOpen} onClose={() => setRequestModalOpen(false)} title="Log Infrastructure Maintenance Ticket">
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Asset *</label>
            <select
              required
              value={requestForm.assetId}
              onChange={(e) => setRequestForm({ ...requestForm, assetId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Select Asset</option>
              {assets.map((a) => (
                <option key={a._id} value={a._id}>{a.assetCode} – {a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Problem Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Silt accumulation in conduit / pump bearing vibration"
              value={requestForm.problem}
              onChange={(e) => setRequestForm({ ...requestForm, problem: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={requestForm.priority}
                onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estimated Cost (₹ INR)</label>
              <input
                type="number"
                value={requestForm.estimatedCost}
                onChange={(e) => setRequestForm({ ...requestForm, estimatedCost: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description & Scope</label>
            <textarea
              rows={3}
              value={requestForm.description}
              onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRequestModalOpen(false)} className="px-3 py-2 border rounded-lg text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Work Order */}
      <Modal isOpen={workOrderModalOpen} onClose={() => setWorkOrderModalOpen(false)} title="Issue Official Maintenance Work Order">
        <form onSubmit={handleCreateWorkOrder} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Asset *</label>
            <select
              required
              value={workOrderForm.assetId}
              onChange={(e) => setWorkOrderForm({ ...workOrderForm, assetId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Select Asset</option>
              {assets.map((a) => (
                <option key={a._id} value={a._id}>{a.assetCode} – {a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Work Description *</label>
            <textarea
              required
              rows={2}
              value={workOrderForm.workDescription}
              onChange={(e) => setWorkOrderForm({ ...workOrderForm, workDescription: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Labor Cost (₹)</label>
              <input
                type="number"
                value={workOrderForm.laborCost}
                onChange={(e) => setWorkOrderForm({ ...workOrderForm, laborCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Material Cost (₹)</label>
              <input
                type="number"
                value={workOrderForm.materialCost}
                onChange={(e) => setWorkOrderForm({ ...workOrderForm, materialCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Other Cost (₹)</label>
              <input
                type="number"
                value={workOrderForm.otherCost}
                onChange={(e) => setWorkOrderForm({ ...workOrderForm, otherCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border text-xs flex justify-between font-bold">
            <span>Total Calculated Work Order Cost:</span>
            <span className="font-mono text-brand-700">
              {formatCurrency((workOrderForm.laborCost || 0) + (workOrderForm.materialCost || 0) + (workOrderForm.otherCost || 0))}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setWorkOrderModalOpen(false)} className="px-3 py-2 border rounded-lg text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold">
              {submitting ? 'Issuing...' : 'Issue Work Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Preventive Schedule */}
      <Modal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Create Recurring Maintenance Schedule">
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.post('/maintenance/schedules', scheduleForm);
            setScheduleModalOpen(false);
            fetchData();
          } catch (err) { alert(err.message || 'Failed'); }
        }} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Asset *</label>
            <select
              required
              value={scheduleForm.assetId}
              onChange={(e) => setScheduleForm({ ...scheduleForm, assetId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Select Asset</option>
              {assets.map((a) => (<option key={a._id} value={a._id}>{a.assetCode} – {a.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Schedule Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly High-Pressure Conduit Desilting"
              value={scheduleForm.title}
              onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Frequency (Days)</label>
              <input
                type="number"
                value={scheduleForm.frequencyDays}
                onChange={(e) => setScheduleForm({ ...scheduleForm, frequencyDays: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Scheduled Run Date</label>
              <input
                type="date"
                required
                value={scheduleForm.nextDueDate}
                onChange={(e) => setScheduleForm({ ...scheduleForm, nextDueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setScheduleModalOpen(false)} className="px-3 py-2 border rounded-lg text-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold">Establish Schedule</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
