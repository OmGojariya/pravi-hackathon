import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Bell, CheckCircle2, ArrowRight } from 'lucide-react';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.success) setNotifications(res.data || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifs();
    } catch (e) {}
  };

  const markSingleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifs();
    } catch (e) {}
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit'] flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600" />
            <span>Operational Alerts & Notifications</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated system notifications for upcoming inspections, work orders, warranty expiries, and critical asset events.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
        >
          Mark All Read
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading alerts stream...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No active alerts.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                !n.isRead ? 'bg-blue-50/40' : 'hover:bg-slate-50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${!n.isRead ? 'bg-brand-600' : 'bg-slate-300'}`} />
                  <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 pl-4 leading-relaxed">{n.message}</p>
                {n.relatedAsset && (
                  <div className="pl-4 pt-1">
                    <Link
                      to={`/assets/${n.relatedAsset?.assetCode || n.relatedAsset?._id}`}
                      className="text-[11px] font-semibold text-brand-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Jump to {n.relatedAsset.assetCode} ({n.relatedAsset.name})</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {!n.isRead && (
                <button
                  onClick={() => markSingleRead(n._id)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded text-xs"
                  title="Mark as read"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
