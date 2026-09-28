import React from 'react';

export const ConditionBadge = ({ rating, score }) => {
  const r = (rating || '').toUpperCase();
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  if (r === 'EXCELLENT') {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-300';
  } else if (r === 'GOOD') {
    color = 'bg-green-50 text-green-700 border-green-300';
  } else if (r === 'FAIR') {
    color = 'bg-amber-50 text-amber-700 border-amber-300';
  } else if (r === 'POOR') {
    color = 'bg-orange-50 text-orange-700 border-orange-300';
  } else if (r === 'CRITICAL') {
    color = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        r === 'EXCELLENT' ? 'bg-emerald-500' :
        r === 'GOOD' ? 'bg-green-500' :
        r === 'FAIR' ? 'bg-amber-500' :
        r === 'POOR' ? 'bg-orange-500' : 'bg-rose-500'
      }`} />
      {r || 'UNKNOWN'}
      {score !== undefined && score !== null ? ` (${score})` : ''}
    </span>
  );
};

export const LifecycleBadge = ({ status }) => {
  const s = (status || '').toUpperCase();
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['OPERATIONAL', 'COMMISSIONED'].includes(s)) {
    color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (['UNDER_CONSTRUCTION', 'APPROVED', 'PLANNED', 'PROCUREMENT'].includes(s)) {
    color = 'bg-sky-50 text-sky-800 border-sky-200';
  } else if (['UNDER_INSPECTION', 'UNDER_MAINTENANCE'].includes(s)) {
    color = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (['REHABILITATION'].includes(s)) {
    color = 'bg-purple-50 text-purple-800 border-purple-200';
  } else if (['DECOMMISSIONED', 'DISPOSED'].includes(s)) {
    color = 'bg-zinc-100 text-zinc-700 border-zinc-300';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {s.replace(/_/g, ' ')}
    </span>
  );
};

export const CriticalityBadge = ({ level }) => {
  const l = (level || '').toUpperCase();
  let color = 'bg-slate-100 text-slate-600 border-slate-200';

  if (l === 'CRITICAL') {
    color = 'bg-red-50 text-red-700 border-red-300 font-semibold';
  } else if (l === 'HIGH') {
    color = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (l === 'MEDIUM') {
    color = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (l === 'LOW') {
    color = 'bg-slate-100 text-slate-600 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {l || 'NORMAL'}
    </span>
  );
};

export const RiskBadge = ({ level, score }) => {
  const l = (level || '').toUpperCase();
  let color = 'bg-slate-100 text-slate-600 border-slate-200';

  if (l === 'CRITICAL') {
    color = 'bg-rose-100 text-rose-800 border-rose-300';
  } else if (l === 'HIGH') {
    color = 'bg-orange-100 text-orange-800 border-orange-300';
  } else if (l === 'MEDIUM') {
    color = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (l === 'LOW') {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      <span>Risk: {l}</span>
      {score !== undefined && <span className="text-[10px] opacity-75 font-mono">({score})</span>}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const p = (priority || '').toUpperCase();
  let color = 'bg-slate-100 text-slate-600';
  if (p === 'CRITICAL') color = 'bg-red-50 text-red-700 border border-red-200 font-bold';
  else if (p === 'HIGH') color = 'bg-orange-50 text-orange-700 border border-orange-200 font-semibold';
  else if (p === 'MEDIUM') color = 'bg-amber-50 text-amber-700 border border-amber-200';
  else if (p === 'LOW') color = 'bg-slate-50 text-slate-600 border border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs uppercase font-medium ${color}`}>
      {p}
    </span>
  );
};
