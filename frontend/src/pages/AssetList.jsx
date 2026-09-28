import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ConditionBadge,
  LifecycleBadge,
  CriticalityBadge,
  RiskBadge,
} from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Layers,
  Search,
  Filter,
  Plus,
  QrCode,
  Eye,
  Edit,
  Trash2,
  FileDown,
  History,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  RefreshCw,
} from 'lucide-react';

export const AssetList = () => {
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [criticality, setCriticality] = useState(searchParams.get('criticality') || '');

  // QR Modal
  const [selectedAssetQR, setSelectedAssetQR] = useState(null);

  // Delete Confirm Modal
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // Load Categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.success) setCategories(res.data);
      } catch (err) {}
    };
    fetchCategories();
  }, []);

  // Fetch Assets on filter/page change
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        category,
        condition,
        status,
        criticality,
      };

      const res = await api.get('/assets', { params });
      if (res.success) {
        setAssets(res.data || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [pagination.page, category, condition, status, criticality]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchAssets();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setCondition('');
    setStatus('');
    setCriticality('');
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchAssets();
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;
    setDeleteError('');
    try {
      await api.delete(`/assets/${assetToDelete._id}`);
      setAssetToDelete(null);
      fetchAssets();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete asset.');
    }
  };

  const handleExportCSV = () => {
    window.open(`http://localhost:5000/api/reports/inventory/export`, '_blank');
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !selectedAssetQR) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>InfraTrack QR Tag - ${selectedAssetQR.assetCode}</title>
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
            <h2>${selectedAssetQR.name}</h2>
            <p><strong>Code:</strong> ${selectedAssetQR.assetCode}</p>
            <p>${selectedAssetQR.location?.district}, ${selectedAssetQR.location?.state || 'Gujarat'}</p>
            <img src="${selectedAssetQR.qrCode}" />
            <p>InfraTrack • Infrastructure Asset System</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
            Infrastructure Asset Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of registered infrastructure assets, location tags, condition and lifecycle status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {hasRole('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'PROJECT_MANAGER') && (
            <Link
              to="/assets/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Asset</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Asset Code (ROAD-2026-0001), Name, Serial Number, District..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>

            <select
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
            >
              <option value="">All Conditions</option>
              <option value="EXCELLENT">Excellent (90-100)</option>
              <option value="GOOD">Good (75-89)</option>
              <option value="FAIR">Fair (50-74)</option>
              <option value="POOR">Poor (25-49)</option>
              <option value="CRITICAL">Critical (0-24)</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="UNDER_INSPECTION">Under Inspection</option>
              <option value="UNDER_CONSTRUCTION">Under Construction</option>
              <option value="COMMISSIONED">Commissioned</option>
              <option value="PLANNED">Planned</option>
              <option value="DECOMMISSIONED">Decommissioned</option>
              <option value="DISPOSED">Disposed</option>
            </select>

            <select
              value={criticality}
              onChange={(e) => {
                setCriticality(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
            >
              <option value="">Criticality</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <button
              type="submit"
              className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              Filter
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-2 text-slate-500 hover:text-slate-800 rounded-lg text-xs font-medium"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Asset Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Asset Code</th>
                <th className="px-4 py-3">Asset Name & Type</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location / District</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Lifecycle Status</th>
                <th className="px-4 py-3">Criticality</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                      <span>Loading asset inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">No infrastructure assets found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Adjust your search criteria or register a new asset.
                    </p>
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Code */}
                    <td className="px-4 py-3 font-mono font-bold text-brand-700 whitespace-nowrap">
                      <Link to={`/assets/${asset.assetCode}`} className="hover:underline">
                        {asset.assetCode}
                      </Link>
                    </td>

                    {/* Name & Type */}
                    <td className="px-4 py-3">
                      <Link
                        to={`/assets/${asset.assetCode}`}
                        className="font-semibold text-slate-900 hover:text-brand-600 block line-clamp-1"
                      >
                        {asset.name}
                      </Link>
                      <span className="text-[11px] text-slate-500">{asset.type}</span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {asset.categoryId?.name || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      <div>{asset.location?.district || 'Ahmedabad'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {asset.location?.address}
                      </div>
                    </td>

                    {/* Condition Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ConditionBadge
                        rating={asset.condition?.rating}
                        score={asset.condition?.score}
                      />
                    </td>

                    {/* Lifecycle Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <LifecycleBadge status={asset.lifecycle?.status} />
                    </td>

                    {/* Criticality */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CriticalityBadge level={asset.criticality} />
                    </td>

                    {/* Risk Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <RiskBadge level={asset.riskLevel} score={asset.riskScore} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* QR Code preview */}
                        <button
                          onClick={() => setSelectedAssetQR(asset)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Show Asset QR Code Tag"
                        >
                          <QrCode className="w-4 h-4 text-slate-600" />
                        </button>

                        {/* View Details */}
                        <Link
                          to={`/assets/${asset.assetCode}`}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Complete Asset Lifecycle"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Edit */}
                        {hasRole('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'PROJECT_MANAGER') && (
                          <Link
                            to={`/assets/${asset._id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Asset Details"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}

                        {/* Delete */}
                        {hasRole('SUPER_ADMIN', 'ADMIN') && (
                          <button
                            onClick={() => {
                              setDeleteError('');
                              setAssetToDelete(asset);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar (Requirement #62) */}
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {assets.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{pagination.total}</span> assets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1 font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <span className="px-2 text-slate-700 font-semibold">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1 font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Tag Modal */}
      {selectedAssetQR && (
        <Modal
          isOpen={!!selectedAssetQR}
          onClose={() => setSelectedAssetQR(null)}
          title={`Asset Identification Tag: ${selectedAssetQR.assetCode}`}
          maxWidth="max-w-md"
        >
          <div className="text-center space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block">
              {selectedAssetQR.qrCode ? (
                <img
                  src={selectedAssetQR.qrCode}
                  alt={selectedAssetQR.assetCode}
                  className="w-56 h-56 mx-auto rounded shadow-sm bg-white"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  QR Not Generated
                </div>
              )}
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">{selectedAssetQR.name}</h3>
              <p className="text-xs font-mono text-brand-700 font-semibold mt-0.5">
                {selectedAssetQR.assetCode}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {selectedAssetQR.location?.address || selectedAssetQR.location?.district}
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={handlePrintQR}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print QR Plate</span>
              </button>
              <a
                href={selectedAssetQR.qrCode}
                download={`infratrack_${selectedAssetQR.assetCode}.png`}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Save PNG</span>
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal (Rule #2 Guard) */}
      {assetToDelete && (
        <Modal
          isOpen={!!assetToDelete}
          onClose={() => setAssetToDelete(null)}
          title="Confirm Asset Deletion"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            {deleteError ? (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs leading-relaxed">
                <strong>Rule #2 Violation:</strong> {deleteError}
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you wish to delete asset <strong>{assetToDelete.assetCode}</strong> ({assetToDelete.name})?
                <br />
                <span className="text-amber-700 font-medium mt-1 block">
                  Note: If this asset contains historical inspection, maintenance, or incident records, deletion will be blocked and you will be asked to decommission it instead.
                </span>
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssetToDelete(null)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              {!deleteError && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Confirm Delete
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
