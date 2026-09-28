import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { ShieldAlert, Search, RefreshCw, User, Calendar } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs');
      if (res.success) setLogs(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
            System Security & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of state mutations, asset edits, lifecycle transitions, and user logins (Requirement #23).
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-brand-600" />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor / User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-sans">Loading audit stream...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-sans">No audit events recorded yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-sans whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.userId?.name || 'System / Service'}</div>
                      <div className="text-[10px] text-slate-400">{log.userId?.role || 'SYSTEM'}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-700 whitespace-nowrap">{log.action}</td>
                    <td className="px-4 py-3 font-sans whitespace-nowrap">{log.entityType}</td>
                    <td className="px-4 py-3 text-slate-500 text-[11px] truncate max-w-[120px]">{log.entityId}</td>
                    <td className="px-4 py-3 text-slate-400">{log.ipAddress}</td>
                    <td className="px-4 py-3 text-right font-sans">
                      {(log.previousData || log.newData) && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs text-brand-600 hover:underline font-semibold"
                        >
                          View Delta
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delta Inspector Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event Details: ${selectedLog.action}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-slate-600 uppercase text-[10px] block mb-1">Previous State:</span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedLog.previousData, null, 2) || 'None (Initial Creation)'}
                </pre>
              </div>

              <div>
                <span className="font-bold text-slate-600 uppercase text-[10px] block mb-1">New State:</span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedLog.newData, null, 2) || 'None'}
                </pre>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
