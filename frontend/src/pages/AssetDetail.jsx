import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ConditionBadge,
  LifecycleBadge,
  CriticalityBadge,
  RiskBadge,
  PriorityBadge,
} from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Building,
  MapPin,
  Repeat,
  Activity,
  ClipboardList,
  Wrench,
  Briefcase,
  DollarSign,
  FileText,
  Camera,
  AlertTriangle,
  History,
  QrCode,
  Printer,
  Download,
  Upload,
  Plus,
  ArrowLeft,
  Calendar,
  User,
  Shield,
  Clock,
  Layers,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Leaflet marker default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const AssetDetail = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [asset, setAsset] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [maintenance, setMaintenance] = useState({ requests: [], workOrders: [] });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [showLifecycleModal, setShowLifecycleModal] = useState(false);
  const [lifecycleForm, setLifecycleForm] = useState({ newStatus: '', reason: '', remarks: '' });
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    inspectionType: 'Routine',
    conditionScore: 85,
    observations: '',
    recommendations: '',
    nextInspectionDate: '',
  });
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    incidentType: 'Operational Failure',
    severity: 'MEDIUM',
    description: '',
    immediateAction: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Fetch full asset data
  const loadAssetData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assets/${identifier}`);
      if (res.success && res.data) {
        setAsset(res.data);
        const assetId = res.data._id;

        // Fetch complementary tab data in parallel
        const [timelineRes, inspRes, maintRes, docRes] = await Promise.all([
          api.get(`/assets/${assetId}/timeline`),
          api.get(`/assets/${assetId}/inspections`),
          api.get(`/assets/${assetId}/maintenance`),
          api.get(`/assets/${assetId}/documents`),
        ]);

        if (timelineRes.success) setTimeline(timelineRes.data || []);
        if (inspRes.success) setInspections(inspRes.data || []);
        if (maintRes.success) setMaintenance(maintRes.data || { requests: [], workOrders: [] });
        if (docRes.success) setDocuments(docRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssetData();
  }, [identifier]);

  // Handle Lifecycle status change (Requirement #3)
  const handleLifecycleSubmit = async (e) => {
    e.preventDefault();
    if (!lifecycleForm.newStatus) return;
    setSubmitting(true);
    try {
      await api.post(`/assets/${asset._id}/lifecycle`, lifecycleForm);
      setShowLifecycleModal(false);
      setActionMessage('Asset lifecycle status updated successfully.');
      loadAssetData();
    } catch (err) {
      alert(err.message || 'Failed to update lifecycle');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle New Inspection (Requirement #11 & #12)
  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/inspections', {
        assetId: asset._id,
        ...inspectionForm,
      });
      setShowInspectionModal(false);
      setActionMessage('Inspection recorded and asset condition updated.');
      loadAssetData();
    } catch (err) {
      alert(err.message || 'Failed to log inspection');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle New Incident (Requirement #16)
  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/incidents', {
        assetId: asset._id,
        ...incidentForm,
      });
      setShowIncidentModal(false);
      setActionMessage('Incident logged and risk recalculated.');
      loadAssetData();
    } catch (err) {
      alert(err.message || 'Failed to log incident');
    } finally {
      setSubmitting(false);
    }
  };

  // Print QR Tag
  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !asset) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>InfraTrack Tag - ${asset.assetCode}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            .card { border: 2px solid #000; padding: 24px; display: inline-block; border-radius: 12px; }
            h2 { margin: 0 0 8px; font-size: 20px; }
            p { margin: 4px 0; color: #444; font-size: 13px; }
            img { margin: 16px 0; width: 220px; height: 220px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${asset.name}</h2>
            <p><strong>Code:</strong> ${asset.assetCode}</p>
            <p>${asset.location?.address || asset.location?.district}</p>
            <img src="${asset.qrCode}" />
            <p>Scan to verify physical asset identity</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 animate-pulse">Loading comprehensive asset dossier...</div>;
  }

  if (!asset) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Asset Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">No infrastructure asset found with identifier '{identifier}'.</p>
        <Link to="/assets" className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">
          Return to Inventory
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'location', label: 'Location Map', icon: MapPin },
    { id: 'lifecycle', label: 'Lifecycle', icon: Repeat },
    { id: 'condition', label: 'Condition Assessment', icon: Activity },
    { id: 'inspections', label: `Inspections (${inspections.length})`, icon: ClipboardList },
    { id: 'maintenance', label: `Maintenance (${maintenance.requests.length + maintenance.workOrders.length})`, icon: Wrench },
    { id: 'projects', label: 'Capital Projects', icon: Briefcase },
    { id: 'financial', label: 'Lifecycle Financials', icon: DollarSign },
    { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
    { id: 'photos', label: 'Photo Gallery', icon: Camera },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'timeline', label: `Timeline (${timeline.length})`, icon: History },
  ];

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/assets" className="hover:text-brand-600 flex items-center gap-1 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Inventory</span>
              </Link>
              <span>/</span>
              <span className="font-mono text-brand-700 font-bold">{asset.assetCode}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
                {asset.name}
              </h1>
              <ConditionBadge rating={asset.condition?.rating} score={asset.condition?.score} />
              <LifecycleBadge status={asset.lifecycle?.status} />
              <CriticalityBadge level={asset.criticality} />
              <RiskBadge level={asset.riskLevel} score={asset.riskScore} />
            </div>

            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              {asset.description || 'Public infrastructure asset tracked under municipal stewardship.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {hasRole('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'PROJECT_MANAGER') && (
              <button
                onClick={() => {
                  setLifecycleForm({ newStatus: asset.lifecycle?.status || '', reason: '', remarks: '' });
                  setShowLifecycleModal(true);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Repeat className="w-4 h-4" />
                <span>Transition Status</span>
              </button>
            )}

            {hasRole('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'INSPECTOR', 'FIELD_ENGINEER') && (
              <button
                onClick={() => setShowInspectionModal(true)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Log Inspection</span>
              </button>
            )}

            <button
              onClick={() => setShowIncidentModal(true)}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Incident</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="font-bold">×</button>
          </div>
        )}
      </div>

      {/* 12 Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white rounded-xl shadow-sm px-2 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 min-w-max p-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: 18 Core Objective Answers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Answer Summary Panel (Answers Requirement #1) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Core Asset Lifecycle Answers</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">1. What is the asset?</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{asset.name} ({asset.type})</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">2. Where is it located?</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {asset.location?.address || 'Site Area'}, {asset.location?.district}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">3. Who owns it?</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{asset.ownerOrganization}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">4. Who manages it?</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {asset.managerId?.name || 'Asset Planning Wing'} ({asset.department})
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">5. When was it created/commissioned?</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {asset.lifecycle?.commissioningDate
                      ? new Date(asset.lifecycle.commissioningDate).toLocaleDateString()
                      : 'Under Construction / Planned'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">6. How much did it cost?</span>
                  <p className="font-semibold text-slate-900 mt-0.5 font-mono">
                    {formatCurrency(asset.financial?.acquisitionCost || asset.financial?.constructionCost)}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">7. What is its current condition?</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {asset.condition?.rating} ({asset.condition?.score}/100)
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">8. Is it operational?</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {asset.lifecycle?.status === 'OPERATIONAL' ? 'Yes • In Active Service' : `No • Status: ${asset.lifecycle?.status}`}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">9. When was it last inspected?</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {asset.condition?.lastInspectionDate
                      ? new Date(asset.condition.lastInspectionDate).toLocaleDateString()
                      : 'Pending Initial Routine Inspection'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">10. Remaining Useful Life?</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {asset.metrics?.remainingUsefulLifeYears !== undefined
                      ? `${asset.metrics.remainingUsefulLifeYears} Years (Age: ${asset.metrics.currentAgeYears} yrs)`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Physical Specifications Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <span>Physical & Engineering Specifications</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Size / Span:</span>
                  <div className="font-semibold text-slate-800">{asset.physicalDetails?.size || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Capacity:</span>
                  <div className="font-semibold text-slate-800">{asset.physicalDetails?.capacity || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Material Composition:</span>
                  <div className="font-semibold text-slate-800">{asset.physicalDetails?.material || 'Reinforced Concrete'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Manufacturer:</span>
                  <div className="font-semibold text-slate-800">{asset.physicalDetails?.manufacturer || 'Standard Public Works'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Model:</span>
                  <div className="font-semibold text-slate-800">{asset.physicalDetails?.model || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Serial / Plant Tag:</span>
                  <div className="font-semibold font-mono text-slate-800">{asset.physicalDetails?.serialNumber || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: QR Tag Card & Mini Condition Meter */}
          <div className="space-y-6">
            {/* QR Plate Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm text-center space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Physical Identification Tag</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block">
                {asset.qrCode ? (
                  <img src={asset.qrCode} alt={asset.assetCode} className="w-48 h-48 mx-auto rounded shadow-sm bg-white" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400">QR Plate Ready</div>
                )}
              </div>
              <div>
                <p className="font-mono text-sm font-bold text-brand-700">{asset.assetCode}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Scan with mobile device to launch field mode</p>
              </div>
              <div className="flex gap-2 justify-center pt-1">
                <button
                  onClick={handlePrintQR}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Plate</span>
                </button>
                <a
                  href={asset.qrCode}
                  download={`infratrack_${asset.assetCode}.png`}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </a>
              </div>
            </div>

            {/* Condition & Risk Meter */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Integrity & Risk Scores</h3>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Condition Score</span>
                  <span className="font-bold text-slate-900">{asset.condition?.score}/100</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      asset.condition?.score >= 75 ? 'bg-emerald-500' :
                      asset.condition?.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${asset.condition?.score || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Calculated Risk Index</span>
                  <span className="font-bold text-slate-900">{asset.riskScore}/100 ({asset.riskLevel})</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      asset.riskScore <= 30 ? 'bg-emerald-500' :
                      asset.riskScore <= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${asset.riskScore || 0}%` }}
                  />
                </div>
              </div>

              {asset.metrics?.replacementRequired && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <strong>Replacement Planning Required:</strong> Remaining useful life is under 2 years.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOCATION MAP */}
      {activeTab === 'location' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">{asset.name} – Geolocation</h3>
              <p className="text-xs text-slate-500">
                Coordinates: {asset.location?.latitude?.toFixed(4)}, {asset.location?.longitude?.toFixed(4)} • {asset.location?.address}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps?q=${asset.location?.latitude},${asset.location?.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="h-96 w-full rounded-xl overflow-hidden border border-slate-200 z-0">
            <MapContainer
              center={[asset.location?.latitude || 23.0225, asset.location?.longitude || 72.5714]}
              zoom={14}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[asset.location?.latitude || 23.0225, asset.location?.longitude || 72.5714]}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">{asset.name}</p>
                    <p className="font-mono text-brand-700">{asset.assetCode}</p>
                    <p className="text-slate-500 mt-1">{asset.location?.address}</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* TAB 3: LIFECYCLE PROGRESSION */}
      {activeTab === 'lifecycle' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Asset Lifecycle Stage Progression</h3>
              <p className="text-xs text-slate-500">
                11-stage asset lifecycle tracking (Requirement #3)
              </p>
            </div>
            {hasRole('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'PROJECT_MANAGER') && (
              <button
                onClick={() => {
                  setLifecycleForm({ newStatus: asset.lifecycle?.status || '', reason: '', remarks: '' });
                  setShowLifecycleModal(true);
                }}
                className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-500 transition-colors"
              >
                Advance Lifecycle Stage
              </button>
            )}
          </div>

          {/* Stepper Display */}
          <div className="overflow-x-auto pb-4">
            <div className="flex items-center min-w-[850px] justify-between">
              {[
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
              ].map((step, idx) => {
                const isCurrent = asset.lifecycle?.status === step;
                return (
                  <div key={step} className="flex flex-col items-center flex-1 relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 z-10 ${
                        isCurrent
                          ? 'bg-brand-600 text-white border-brand-600 ring-4 ring-brand-100'
                          : 'bg-white text-slate-400 border-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`mt-2 text-[10px] uppercase font-semibold text-center ${
                        isCurrent ? 'text-brand-700 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {step.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONDITION ASSESSMENT */}
      {activeTab === 'condition' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Condition Assessment Index (0-100)</h3>
            <p className="text-xs text-slate-500">
              Evaluated across Structural, Operational, and Safety criteria (Requirement #12)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Structural Integrity</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {asset.condition?.score || 80}/100
              </div>
              <p className="text-xs text-slate-500 mt-1">Foundations, spans, load-bearing elements</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Operational Function</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {asset.condition?.score ? Math.min(100, asset.condition.score + 3) : 85}/100
              </div>
              <p className="text-xs text-slate-500 mt-1">Flow rates, capacity throughput, control systems</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Safety Compliance</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {asset.condition?.score ? Math.min(100, asset.condition.score + 5) : 90}/100
              </div>
              <p className="text-xs text-slate-500 mt-1">Public safety factors, emergency provisions</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Last Certified Inspection:</span>
              <span className="font-semibold text-slate-900">
                {asset.condition?.lastInspectionDate ? new Date(asset.condition.lastInspectionDate).toLocaleDateString() : 'None recorded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Next Scheduled Inspection:</span>
              <span className="font-semibold text-slate-900">
                {asset.condition?.nextInspectionDate ? new Date(asset.condition.nextInspectionDate).toLocaleDateString() : 'Not scheduled'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INSPECTIONS */}
      {activeTab === 'inspections' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Inspection History</h3>
              <p className="text-xs text-slate-500">Permanent historical records of certified inspections</p>
            </div>
            {hasRole('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'INSPECTOR', 'FIELD_ENGINEER') && (
              <button
                onClick={() => setShowInspectionModal(true)}
                className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-500 transition-colors"
              >
                Log New Inspection
              </button>
            )}
          </div>

          {inspections.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No inspections recorded for this asset yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {inspections.map((insp) => (
                <div key={insp._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-700">{insp.inspectionId}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">{insp.inspectionType}</span>
                      <ConditionBadge rating={insp.conditionRating} score={insp.conditionScore} />
                    </div>
                    <p className="text-slate-600 mt-1 font-medium">{insp.observations}</p>
                    {insp.recommendations && (
                      <p className="text-slate-400 mt-0.5">Rec: {insp.recommendations}</p>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-slate-400 whitespace-nowrap">
                    <div>{new Date(insp.inspectionDate).toLocaleDateString()}</div>
                    <div>By {insp.inspectorId?.name || 'Inspector'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: MAINTENANCE & WORK ORDERS */}
      {activeTab === 'maintenance' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Maintenance Requests & Work Orders</h3>
            <p className="text-xs text-slate-500">Corrective and preventive maintenance work orders</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Maintenance Requests</h4>
            {maintenance.requests.length === 0 ? (
              <p className="text-xs text-slate-400">No maintenance requests logged.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {maintenance.requests.map((mr) => (
                  <div key={mr._id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{mr.requestId}</span>
                        <PriorityBadge priority={mr.priority} />
                        <span className="font-semibold text-slate-700">{mr.problem}</span>
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap text-[11px] text-slate-500">
                      <div>Status: <strong>{mr.status}</strong></div>
                      <div>{new Date(mr.requestDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-4">Work Orders</h4>
            {maintenance.workOrders.length === 0 ? (
              <p className="text-xs text-slate-400">No active or completed work orders.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {maintenance.workOrders.map((wo) => (
                  <div key={wo._id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-700">{wo.workOrderId}</span>
                        <span className="font-semibold">{wo.workDescription}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Team: {wo.assignedTeam} • Cost: {formatCurrency(wo.totalCost)}
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap text-[11px] text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">{wo.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: CAPITAL PROJECTS */}
      {activeTab === 'projects' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Capital Infrastructure Project Linkage</h3>
          {asset.projectId ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{asset.projectId.name}</span>
                <span className="font-mono text-brand-700 font-semibold">{asset.projectId.projectId}</span>
              </div>
              <p className="text-slate-600">{asset.projectId.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400">Contractor:</span>
                  <div className="font-semibold">{asset.projectId.contractor || 'L&T Civil Infrastructure'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <div className="font-semibold">{asset.projectId.status || 'IN_PROGRESS'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Budget:</span>
                  <div className="font-semibold font-mono">{formatCurrency(asset.projectId.budget)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Expenditure to date:</span>
                  <div className="font-semibold font-mono">{formatCurrency(asset.projectId.actualCost)}</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">This asset was created as an independent municipal facility and is not linked to an active expansion project.</p>
          )}
        </div>
      )}

      {/* TAB 8: LIFECYCLE FINANCIALS */}
      {activeTab === 'financial' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Complete Lifecycle Cost Analysis (Requirement #19)</h3>
            <p className="text-xs text-slate-500">Cumulative capital, civil construction, maintenance, and repair expenditure</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold">Acquisition & Procurement</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {formatCurrency(asset.financial?.acquisitionCost)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold">Civil Construction</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {formatCurrency(asset.financial?.constructionCost)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold">Cumulative Maintenance</span>
              <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
                {formatCurrency(asset.financial?.maintenanceCost)}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Cumulative Lifecycle Cost</span>
              <div className="text-2xl font-bold font-mono text-white mt-0.5">
                {formatCurrency(asset.financial?.totalLifecycleCost)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Document Dossier</h3>
              <p className="text-xs text-slate-500">Contracts, civil engineering drawings, warranties and reports</p>
            </div>
          </div>

          {documents.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No documents uploaded for this asset.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {documents.map((doc) => (
                <div key={doc._id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <span className="font-semibold text-slate-900">{doc.fileName}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600">{doc.documentType}</span>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:underline flex items-center gap-1 font-semibold text-xs"
                  >
                    <span>Download</span>
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 10: PHOTO GALLERY */}
      {activeTab === 'photos' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Field Photos & Visual Evidence</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center p-4 text-center">
              <Camera className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-[11px] text-slate-500 font-medium">Front Elevation</span>
              <span className="text-[10px] text-slate-400">Baseline Tag</span>
            </div>
            <div className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center p-4 text-center">
              <Camera className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-[11px] text-slate-500 font-medium">Pier / Bearing Plate</span>
              <span className="text-[10px] text-slate-400">Inspection</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: INCIDENTS */}
      {activeTab === 'incidents' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Incident & Breakdown Log (Requirement #16)</h3>
              <p className="text-xs text-slate-500">Track structural failures, electrical trips, and emergencies</p>
            </div>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-500 transition-colors"
            >
              Report Incident
            </button>
          </div>
          <p className="text-xs text-slate-400 py-4 text-center">No active open incidents recorded on this asset.</p>
        </div>
      )}

      {/* TAB 12: UNIFIED TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Historical Asset Timeline (Requirement #22)</h3>
            <p className="text-xs text-slate-500">Immutable chronological record of every milestone in this asset's lifecycle</p>
          </div>

          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 text-xs">
            {timeline.length === 0 ? (
              <p className="text-xs text-slate-400 pl-6">No historical records available.</p>
            ) : (
              timeline.map((event, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute -left-2 top-0.5 w-3.5 h-3.5 rounded-full bg-brand-600 border-2 border-white ring-2 ring-brand-100" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{event.title}</span>
                    <span className="text-[11px] text-slate-400">{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{event.description}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">By {event.user}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Transition Lifecycle Status */}
      <Modal isOpen={showLifecycleModal} onClose={() => setShowLifecycleModal(false)} title="Transition Asset Lifecycle Stage">
        <form onSubmit={handleLifecycleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Stage</label>
            <select
              required
              value={lifecycleForm.newStatus}
              onChange={(e) => setLifecycleForm({ ...lifecycleForm, newStatus: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Select Target Status</option>
              <option value="PLANNED">Planned</option>
              <option value="APPROVED">Approved</option>
              <option value="PROCUREMENT">Procurement</option>
              <option value="UNDER_CONSTRUCTION">Under Construction</option>
              <option value="COMMISSIONED">Commissioned</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="UNDER_INSPECTION">Under Inspection</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="REHABILITATION">Rehabilitation</option>
              <option value="DECOMMISSIONED">Decommissioned</option>
              <option value="DISPOSED">Disposed</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Transition *</label>
            <input
              type="text"
              required
              placeholder="e.g. Civil construction completed and safety certificate issued"
              value={lifecycleForm.reason}
              onChange={(e) => setLifecycleForm({ ...lifecycleForm, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Additional Remarks</label>
            <textarea
              rows={2}
              value={lifecycleForm.remarks}
              onChange={(e) => setLifecycleForm({ ...lifecycleForm, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowLifecycleModal(false)}
              className="px-3 py-2 border rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold"
            >
              {submitting ? 'Updating...' : 'Commit Status'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Log Inspection */}
      <Modal isOpen={showInspectionModal} onClose={() => setShowInspectionModal(false)} title="Conduct Asset Inspection">
        <form onSubmit={handleInspectionSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inspection Type</label>
              <select
                value={inspectionForm.inspectionType}
                onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionType: e.target.value })}
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
              <label className="block font-semibold text-slate-700 mb-1">Condition Score (0-100) *</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={inspectionForm.conditionScore}
                onChange={(e) => setInspectionForm({ ...inspectionForm, conditionScore: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observations *</label>
            <textarea
              required
              rows={3}
              placeholder="Physical condition, cracks, wear, hydraulic performance..."
              value={inspectionForm.observations}
              onChange={(e) => setInspectionForm({ ...inspectionForm, observations: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Recommendations</label>
            <input
              type="text"
              placeholder="e.g. Schedule crack sealing or desilting within 30 days"
              value={inspectionForm.recommendations}
              onChange={(e) => setInspectionForm({ ...inspectionForm, recommendations: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Next Inspection Due Date</label>
            <input
              type="date"
              value={inspectionForm.nextInspectionDate}
              onChange={(e) => setInspectionForm({ ...inspectionForm, nextInspectionDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowInspectionModal(false)}
              className="px-3 py-2 border rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold"
            >
              {submitting ? 'Submitting...' : 'Certify Inspection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Report Incident */}
      <Modal isOpen={showIncidentModal} onClose={() => setShowIncidentModal(false)} title="Report Incident / Breakdown">
        <form onSubmit={handleIncidentSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Incident Type</label>
              <input
                type="text"
                required
                placeholder="e.g. Sluice Gate Jam, Pipe Burst"
                value={incidentForm.incidentType}
                onChange={(e) => setIncidentForm({ ...incidentForm, incidentType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={incidentForm.severity}
                onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Incident Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Describe what occurred, timing, and immediate impact..."
              value={incidentForm.description}
              onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Immediate Remedial Action</label>
            <input
              type="text"
              placeholder="e.g. Traffic diverted, bypass line activated"
              value={incidentForm.immediateAction}
              onChange={(e) => setIncidentForm({ ...incidentForm, immediateAction: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowIncidentModal(false)}
              className="px-3 py-2 border rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold"
            >
              {submitting ? 'Filing...' : 'File Incident Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
