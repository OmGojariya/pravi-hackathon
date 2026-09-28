import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { ConditionBadge, LifecycleBadge } from '../components/common/Badge';
import { Building, MapPin, ShieldCheck, QrCode, Lock, ArrowRight } from 'lucide-react';

export const PublicAssetScan = () => {
  const { identifier } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicAsset = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/assets/${identifier}`);
        if (res.success) {
          setAsset(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicAsset();
  }, [identifier]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white text-xs animate-pulse">
        Verifying physical infrastructure QR tag...
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <h2 className="text-lg font-bold text-slate-900">QR Tag Not Recognized</h2>
          <p className="text-xs text-slate-500">
            No registered infrastructure asset matches code '{identifier}'.
          </p>
          <Link to="/login" className="inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">
            Return to Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-brand-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center border-b border-slate-800">
          <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 mb-2">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            Public Asset Identification Plate
          </div>
          <h1 className="text-xl font-bold font-['Outfit'] mt-1">{asset.name}</h1>
          <p className="font-mono text-xs text-brand-400 font-semibold">{asset.assetCode}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Condition Rating</span>
              <div className="mt-1">
                <ConditionBadge rating={asset.condition?.rating} score={asset.condition?.score} />
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Operational Status</span>
              <div className="mt-1">
                <LifecycleBadge status={asset.lifecycle?.status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-700">
            <div className="p-3 border rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase">Infrastructure Type</span>
              <span className="font-semibold text-slate-900">{asset.type}</span>
            </div>
            <div className="p-3 border rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase">Owner Agency</span>
              <span className="font-semibold text-slate-900">{asset.ownerOrganization}</span>
            </div>
            <div className="p-3 border rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase">District & State</span>
              <span className="font-semibold text-slate-900">{asset.location?.district}, {asset.location?.state}</span>
            </div>
            <div className="p-3 border rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase">Department</span>
              <span className="font-semibold text-slate-900">{asset.department}</span>
            </div>
          </div>

          <p className="text-slate-500 leading-relaxed text-xs">
            {asset.description}
          </p>

          {/* Login prompt for enterprise controls */}
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl space-y-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-brand-900 font-bold text-xs">
              <Lock className="w-4 h-4 text-brand-600" />
              <span>Restricted Engineering Dossier</span>
            </div>
            <p className="text-[11px] text-brand-800">
              Technical CAD drawings, financial lifecycle expenditures, and field inspection workflows require authorized staff credentials.
            </p>
            <Link
              to={`/login?redirect=/assets/${asset.assetCode}`}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
            >
              <span>Sign In as Field Engineer / Officer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
