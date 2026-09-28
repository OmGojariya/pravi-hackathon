import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client';
import {
  Building,
  Save,
  ArrowLeft,
  MapPin,
  FileText,
  DollarSign,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';

export const AssetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    assetCode: '',
    categoryId: '',
    type: '',
    description: '',
    ownerOrganization: 'Ahmedabad Urban Development Authority (AUDA)',
    department: 'Public Works Department',
    responsibleOfficer: '',
    location: {
      address: '',
      city: 'Ahmedabad',
      district: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001',
      latitude: 23.0225,
      longitude: 72.5714,
    },
    physicalDetails: {
      size: '',
      length: '',
      width: '',
      height: '',
      capacity: '',
      unit: '',
      material: 'Reinforced Concrete / Structural Steel',
      manufacturer: '',
      model: '',
      serialNumber: '',
    },
    lifecycle: {
      status: 'PLANNED',
      usefulLife: 30,
      plannedDate: new Date().toISOString().split('T')[0],
      commissioningDate: '',
    },
    condition: {
      score: 85,
      rating: 'GOOD',
    },
    financial: {
      acquisitionCost: 0,
      constructionCost: 0,
      installationCost: 0,
    },
    criticality: 'MEDIUM',
    projectId: '',
    tags: '',
  });

  // Load Categories & Projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prjRes] = await Promise.all([
          api.get('/categories'),
          api.get('/projects'),
        ]);
        if (catRes.success) setCategories(catRes.data);
        if (prjRes.success) setProjects(prjRes.data);

        if (isEditing) {
          setLoading(true);
          const assetRes = await api.get(`/assets/${id}`);
          if (assetRes.success) {
            const a = assetRes.data;
            setFormData({
              name: a.name || '',
              assetCode: a.assetCode || '',
              categoryId: a.categoryId?._id || a.categoryId || '',
              type: a.type || '',
              description: a.description || '',
              ownerOrganization: a.ownerOrganization || '',
              department: a.department || '',
              responsibleOfficer: a.responsibleOfficer || '',
              location: {
                address: a.location?.address || '',
                city: a.location?.city || '',
                district: a.location?.district || 'Ahmedabad',
                state: a.location?.state || 'Gujarat',
                pincode: a.location?.pincode || '',
                latitude: a.location?.latitude || 23.0225,
                longitude: a.location?.longitude || 72.5714,
              },
              physicalDetails: {
                size: a.physicalDetails?.size || '',
                length: a.physicalDetails?.length || '',
                width: a.physicalDetails?.width || '',
                height: a.physicalDetails?.height || '',
                capacity: a.physicalDetails?.capacity || '',
                unit: a.physicalDetails?.unit || '',
                material: a.physicalDetails?.material || '',
                manufacturer: a.physicalDetails?.manufacturer || '',
                model: a.physicalDetails?.model || '',
                serialNumber: a.physicalDetails?.serialNumber || '',
              },
              lifecycle: {
                status: a.lifecycle?.status || 'PLANNED',
                usefulLife: a.lifecycle?.usefulLife || 30,
                plannedDate: a.lifecycle?.plannedDate ? new Date(a.lifecycle.plannedDate).toISOString().split('T')[0] : '',
                commissioningDate: a.lifecycle?.commissioningDate ? new Date(a.lifecycle.commissioningDate).toISOString().split('T')[0] : '',
              },
              condition: {
                score: a.condition?.score || 85,
                rating: a.condition?.rating || 'GOOD',
              },
              financial: {
                acquisitionCost: a.financial?.acquisitionCost || 0,
                constructionCost: a.financial?.constructionCost || 0,
                installationCost: a.financial?.installationCost || 0,
              },
              criticality: a.criticality || 'MEDIUM',
              projectId: a.projectId?._id || a.projectId || '',
              tags: a.tags?.join(', ') || '',
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  // When category changes, update available subcategories
  const selectedCategoryObj = categories.find((c) => c._id === formData.categoryId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        financial: {
          acquisitionCost: Number(formData.financial.acquisitionCost || 0),
          constructionCost: Number(formData.financial.constructionCost || 0),
          installationCost: Number(formData.financial.installationCost || 0),
        },
        location: {
          ...formData.location,
          latitude: Number(formData.location.latitude || 23.0225),
          longitude: Number(formData.location.longitude || 72.5714),
        },
        lifecycle: {
          ...formData.lifecycle,
          usefulLife: Number(formData.lifecycle.usefulLife || 30),
        },
        condition: {
          score: Number(formData.condition.score || 80),
          rating: formData.condition.rating,
        },
      };

      if (!payload.projectId) delete payload.projectId;

      if (isEditing) {
        await api.put(`/assets/${id}`, payload);
        navigate(`/assets/${payload.assetCode || id}`);
      } else {
        const res = await api.post('/assets', payload);
        if (res.success && res.data) {
          navigate(`/assets/${res.data.assetCode}`);
        } else {
          navigate('/assets');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save asset.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading asset form...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/assets"
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
              {isEditing ? `Edit Asset: ${formData.assetCode}` : 'Register New Infrastructure Asset'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete inventory registration conforming to state infrastructure asset taxonomy.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Classification */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-600" />
            <span>1. Asset Classification & Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asset Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sabarmati Cable-Stayed River Crossing"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Infrastructure Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => {
                  const cat = categories.find((c) => c._id === e.target.value);
                  setFormData({
                    ...formData,
                    categoryId: e.target.value,
                    type: cat?.subcategories?.[0] || '',
                  });
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asset Type / Subcategory <span className="text-rose-500">*</span>
              </label>
              {selectedCategoryObj?.subcategories?.length > 0 ? (
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select Subcategory</option>
                  {selectedCategoryObj.subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. Highway, Water Tank, Substation..."
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Asset Code (Leave blank to auto-generate like ROAD-2026-0001)
              </label>
              <input
                type="text"
                disabled={isEditing}
                placeholder="AUTO-GENERATED"
                value={formData.assetCode}
                onChange={(e) => setFormData({ ...formData, assetCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-mono bg-slate-50 disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Engineering Description & Scope
              </label>
              <textarea
                rows={2}
                placeholder="Comprehensive technical specifications and structural scope..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Ownership & Location */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>2. Ownership & Geolocation</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Organization</label>
              <input
                type="text"
                value={formData.ownerOrganization}
                onChange={(e) => setFormData({ ...formData, ownerOrganization: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Responsible Officer</label>
              <input
                type="text"
                placeholder="Executive Engineer Name"
                value={formData.responsibleOfficer}
                onChange={(e) => setFormData({ ...formData, responsibleOfficer: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Site Address / Landmark</label>
              <input
                type="text"
                placeholder="e.g. SP Ring Road, Ognaj Overbridge Intersection"
                value={formData.location.address}
                onChange={(e) =>
                  setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={formData.location.district}
                onChange={(e) =>
                  setFormData({ ...formData, location: { ...formData.location, district: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.location.latitude}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, latitude: parseFloat(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.location.longitude}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, longitude: parseFloat(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Capital Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="">None / Standalone</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.projectId})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Physical & Engineering Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>3. Physical Dimensions & Material Specs</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Overall Size / Rating</label>
              <input
                type="text"
                placeholder="e.g. 14.2 km / 500 MLD / 200 MVA"
                value={formData.physicalDetails.size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    physicalDetails: { ...formData.physicalDetails, size: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Material</label>
              <input
                type="text"
                placeholder="e.g. Pre-stressed Concrete, Structural Steel"
                value={formData.physicalDetails.material}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    physicalDetails: { ...formData.physicalDetails, material: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer / OEM</label>
              <input
                type="text"
                placeholder="e.g. Siemens, Kirloskar, L&T"
                value={formData.physicalDetails.manufacturer}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    physicalDetails: { ...formData.physicalDetails, manufacturer: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serial / Plant Tag Number</label>
              <input
                type="text"
                placeholder="e.g. KBL-2019-9941"
                value={formData.physicalDetails.serialNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    physicalDetails: { ...formData.physicalDetails, serialNumber: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Design Capacity</label>
              <input
                type="text"
                placeholder="e.g. 8,500 cu m/hr"
                value={formData.physicalDetails.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    physicalDetails: { ...formData.physicalDetails, capacity: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="Highway, SCADA, Emergency"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Lifecycle, Criticality & Financials */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brand-600" />
            <span>4. Lifecycle, Criticality & Financial Records</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lifecycle Status</label>
              <select
                value={formData.lifecycle.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lifecycle: { ...formData.lifecycle, status: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
              >
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Useful Life (Years)</label>
              <input
                type="number"
                min="1"
                max="150"
                value={formData.lifecycle.usefulLife}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lifecycle: { ...formData.lifecycle, usefulLife: parseInt(e.target.value, 10) },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Criticality Tier</label>
              <select
                value={formData.criticality}
                onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 font-semibold"
              >
                <option value="LOW">Low (Standard Non-Critical)</option>
                <option value="MEDIUM">Medium (Normal Municipal Operations)</option>
                <option value="HIGH">High (Major Transport / Utility Arteries)</option>
                <option value="CRITICAL">Critical (Life-Safety / Key Grid / Emergency)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Acquisition Cost (₹ INR)</label>
              <input
                type="number"
                value={formData.financial.acquisitionCost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    financial: { ...formData.financial, acquisitionCost: parseFloat(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Construction / Civil Cost (₹ INR)</label>
              <input
                type="number"
                value={formData.financial.constructionCost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    financial: { ...formData.financial, constructionCost: parseFloat(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Baseline Condition Score (0-100)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.condition.score}
                  onChange={(e) => {
                    const sc = parseInt(e.target.value, 10);
                    let rt = 'GOOD';
                    if (sc >= 90) rt = 'EXCELLENT';
                    else if (sc >= 75) rt = 'GOOD';
                    else if (sc >= 50) rt = 'FAIR';
                    else if (sc >= 25) rt = 'POOR';
                    else rt = 'CRITICAL';
                    setFormData({
                      ...formData,
                      condition: { score: sc, rating: rt },
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-mono"
                />
                <span className="px-2.5 py-1.5 rounded-lg border text-xs font-bold bg-slate-50">
                  {formData.condition.rating}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/assets"
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Committing...' : isEditing ? 'Update Asset' : 'Register Asset'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
