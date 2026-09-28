import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { ConditionBadge, LifecycleBadge } from '../components/common/Badge';
import { Repeat, ArrowRight, Layers } from 'lucide-react';

export const LifecycleTracking = () => {
  const [assets, setAssets] = useState([]);
  const [selectedStage, setSelectedStage] = useState('OPERATIONAL');
  const [loading, setLoading] = useState(true);

  const STAGES = [
    'PLANNED',
    'APPROVED',
    'PROCUREMENT',
    'UNDER_CONSTRUCTION',
    'COMMISSIONED',
    'OPERATIONAL',
    'UNDER_INSPECTION',
    'UNDER_MAINTENANCE',
    'REHABILITATION',
    'DECOMMISSIONED',
    'DISPOSED',
  ];

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const res = await api.get('/assets', { params: { limit: 100 } });
        if (res.success) setAssets(res.data || []);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const stageCounts = {};
  STAGES.forEach((s) => {
    stageCounts[s] = assets.filter((a) => a.lifecycle?.status === s).length;
  });

  const filtered = assets.filter((a) => a.lifecycle?.status === selectedStage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit'] flex items-center gap-2">
          <Repeat className="w-6 h-6 text-brand-600" />
          <span>Infrastructure Lifecycle Progression Tracker</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          11-stage lifecycle pipeline monitoring from conceptual planning through decommissioning and disposal (Requirement #3).
        </p>
      </div>

      {/* Stage Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {STAGES.map((st) => {
          const isSelected = selectedStage === st;
          const count = stageCounts[st] || 0;
          return (
            <button
              key={st}
              onClick={() => setSelectedStage(st)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 truncate">
                {st.replace(/_/g, ' ')}
              </div>
              <div className="text-xl font-bold font-mono mt-1">
                {count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Assets in Selected Stage */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Stage: {selectedStage.replace(/_/g, ' ')}
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filtered.length} assets currently in this stage.
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">
            No assets currently positioned in the {selectedStage} stage.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a) => (
              <div
                key={a._id}
                className="p-4 rounded-xl border border-slate-200 hover:border-brand-300 transition-all space-y-3 bg-slate-50/50 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-700">{a.assetCode}</span>
                    <ConditionBadge rating={a.condition?.rating} score={a.condition?.score} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{a.name}</h4>
                  <p className="text-xs text-slate-500">{a.type} • {a.location?.district}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Age: {a.metrics?.currentAgeYears || 2} yrs
                  </span>
                  <Link
                    to={`/assets/${a.assetCode}`}
                    className="text-brand-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>View Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
