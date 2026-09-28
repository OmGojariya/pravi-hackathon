import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  FileText,
  FileDown,
  BarChart3,
  Layers,
  Activity,
  Wrench,
  DollarSign,
  ClipboardList,
  AlertOctagon,
  Calendar,
  Briefcase,
  ShoppingCart,
  Archive,
  Download,
} from 'lucide-react';

export const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('inventory');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  const reportTypes = [
    { id: 'inventory', label: '1. Complete Asset Inventory', icon: Layers, desc: 'Full registry of all infrastructure assets with specs and locations' },
    { id: 'condition', label: '2. Asset Condition Report', icon: Activity, desc: 'Condition rankings from Critical to Excellent with scores' },
    { id: 'maintenance', label: '3. Maintenance Report', icon: Wrench, desc: 'Corrective & preventive requests, costs, and work orders' },
    { id: 'lifecycle-cost', label: '4. Lifecycle Cost Report', icon: DollarSign, desc: 'Acquisition, construction, and cumulative maintenance costs' },
    { id: 'inspections', label: '5. Inspection Report', icon: ClipboardList, desc: 'Certified technical audits, scores, and recommendations' },
    { id: 'critical', label: '6. Critical Asset Report', icon: AlertOctagon, desc: 'Assets flagged as high-risk, critical condition, or high criticality' },
    { id: 'age', label: '7. Asset Age & Remaining Life', icon: Calendar, desc: 'Useful service life vs chronological age analysis' },
    { id: 'projects', label: '8. Capital Projects Report', icon: Briefcase, desc: 'Capital works programs, budgets, and linked infrastructure' },
    { id: 'procurement', label: '9. Procurement & Warranty', icon: ShoppingCart, desc: 'Supplier purchase orders, active contracts, and warranty expiries' },
    { id: 'disposal', label: '10. Asset Disposal Report', icon: Archive, desc: 'Decommissioned, condemned, and disposed assets audit trail' },
  ];

  const fetchReport = async (type) => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/${type}`);
      if (res.success) {
        setReportData(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedReport);
  }, [selectedReport]);

  const handleExportCSV = () => {
    window.open(`http://localhost:5000/api/reports/${selectedReport}/export`, '_blank');
  };

  const activeMeta = reportTypes.find((r) => r.id === selectedReport);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
            Infrastructure Governance & Audit Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-configured reports covering asset inventory, lifecycle cost, condition audits, and disposal (Requirement #26).
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <FileDown className="w-4 h-4" />
          <span>Export {activeMeta?.label.split('.')[1]} to CSV</span>
        </button>
      </div>

      {/* Report Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportTypes.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedReport === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-sm ring-1 ring-brand-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                {isSelected && <span className="w-2 h-2 rounded-full bg-brand-600" />}
              </div>
              <div>
                <span className="font-bold text-xs block leading-tight">{r.label}</span>
                <span className="text-[10px] text-slate-500 mt-1 line-clamp-1 block">{r.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Report Content Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">{activeMeta?.label}</h3>
            <p className="text-xs text-slate-500">{activeMeta?.desc}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-200 text-slate-800">
            {reportData.length} records generated
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Code / ID</th>
                <th className="px-4 py-3">Name / Primary Entity</th>
                <th className="px-4 py-3">Category / Type</th>
                <th className="px-4 py-3">Metric / Valuation</th>
                <th className="px-4 py-3">Status / Rating</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Compiling report dataset...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No records found for this report criteria.
                  </td>
                </tr>
              ) : (
                reportData.map((item, idx) => {
                  const code = item.assetCode || item.requestId || item.inspectionId || item.projectId || item.procurementId || `ROW-${idx + 1}`;
                  const name = item.name || item.problem || item.observations || item.purchaseOrder || item.title || 'Record';
                  const type = item.type || item.inspectionType || item.maintenanceType || item.category?.name || 'General';
                  const metric = item.financial?.totalLifecycleCost ? `₹${item.financial.totalLifecycleCost.toLocaleString()}` :
                                 item.condition?.score !== undefined ? `Score: ${item.condition.score}/100` :
                                 item.budget ? `₹${item.budget.toLocaleString()}` :
                                 item.estimatedCost ? `₹${item.estimatedCost.toLocaleString()}` : '-';
                  const status = item.lifecycle?.status || item.status || item.condition?.rating || item.priority || '-';
                  const date = item.createdAt || item.date || item.inspectionDate || item.requestDate || Date.now();

                  return (
                    <tr key={item._id || idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-brand-700 whitespace-nowrap">{code}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-sm truncate">{name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{type}</td>
                      <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">{metric}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100">{status}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{new Date(date).toLocaleDateString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
