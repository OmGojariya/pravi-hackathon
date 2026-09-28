import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import {
  Truck,
  ShoppingCart,
  Plus,
  Building,
  CheckCircle2,
  Calendar,
  DollarSign,
  Shield,
  Star,
} from 'lucide-react';

export const ProcurementVendors = () => {
  const { hasRole } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('vendors'); // 'vendors' | 'procurements'
  const [vendors, setVendors] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [procModalOpen, setProcModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [vendorForm, setVendorForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
  });

  const [procForm, setProcForm] = useState({
    assetId: '',
    vendorId: '',
    purchaseOrder: '',
    contractNumber: '',
    purchaseCost: 0,
    warrantyPeriod: 24,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, pRes, aRes] = await Promise.all([
        api.get('/vendors'),
        api.get('/procurement'),
        api.get('/assets', { params: { limit: 100 } }),
      ]);
      if (vRes.success) setVendors(vRes.data || []);
      if (pRes.success) setProcurements(pRes.data || []);
      if (aRes.success) setAssets(aRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/vendors', vendorForm);
      setVendorModalOpen(false);
      setVendorForm({ name: '', contactPerson: '', email: '', phone: '', address: '', gstNumber: '' });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to add vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProcurement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/procurement', procForm);
      setProcModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create procurement');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => (val ? `₹${val.toLocaleString()}` : '₹0');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
            Vendors & Capital Procurement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered supplier contractors, equipment procurement records, and warranty lifecycles (Requirement #18).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'vendors' && hasRole('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER') && (
            <button
              onClick={() => setVendorModalOpen(true)}
              className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Vendor</span>
            </button>
          )}

          {activeSubTab === 'procurements' && hasRole('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER') && (
            <button
              onClick={() => setProcModalOpen(true)}
              className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('vendors')}
          className={`pb-2.5 px-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeSubTab === 'vendors'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Vendors & Contractors ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('procurements')}
          className={`pb-2.5 px-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeSubTab === 'procurements'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Procurement & Warranties ({procurements.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: VENDORS */}
      {activeSubTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <div key={v._id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{v.name}</h3>
                  <span className="text-xs text-slate-500">{v.contactPerson || 'Official Representative'}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-xs font-bold">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{v.rating || 4.5}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                <div><strong>GST:</strong> <span className="font-mono">{v.gstNumber || '24AAACL0123M1Z9'}</span></div>
                <div><strong>Email:</strong> {v.email || 'procurement@vendor.com'}</div>
                <div><strong>Phone:</strong> {v.phone || '+91 98250 00000'}</div>
              </div>

              <p className="text-[11px] text-slate-500 line-clamp-1">{v.address || 'Ahmedabad, Gujarat'}</p>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 2: PROCUREMENTS */}
      {activeSubTab === 'procurements' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">PO & Procurement ID</th>
                  <th className="px-4 py-3">Asset Target</th>
                  <th className="px-4 py-3">Contractor / Vendor</th>
                  <th className="px-4 py-3">Purchase Cost</th>
                  <th className="px-4 py-3">Warranty Expiry</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {procurements.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-slate-900">{p.purchaseOrder}</div>
                      <div className="text-[10px] text-slate-400">{p.procurementId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/assets/${p.assetId?.assetCode}`} className="font-semibold text-brand-700 hover:underline">
                        {p.assetId?.name}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-400 block">{p.assetId?.assetCode}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.vendorId?.name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{formatCurrency(p.purchaseCost)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {p.warrantyExpiry ? new Date(p.warrantyExpiry).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.procurementStatus === 'WARRANTY_ACTIVE' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.procurementStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Register Vendor */}
      <Modal isOpen={vendorModalOpen} onClose={() => setVendorModalOpen(false)} title="Register Supplier Vendor">
        <form onSubmit={handleCreateVendor} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company / Vendor Name *</label>
            <input
              type="text"
              required
              value={vendorForm.name}
              onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={vendorForm.contactPerson}
                onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={vendorForm.gstNumber}
                onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={vendorForm.email}
                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={vendorForm.phone}
                onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setVendorModalOpen(false)} className="px-3 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold">
              {submitting ? 'Registering...' : 'Register Vendor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Log Purchase Order */}
      <Modal isOpen={procModalOpen} onClose={() => setProcModalOpen(false)} title="Record Equipment / Asset Procurement">
        <form onSubmit={handleCreateProcurement} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Asset *</label>
            <select
              required
              value={procForm.assetId}
              onChange={(e) => setProcForm({ ...procForm, assetId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">Select Asset</option>
              {assets.map((a) => (<option key={a._id} value={a._id}>{a.assetCode} – {a.name}</option>))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vendor / OEM Supplier *</label>
            <select
              required
              value={procForm.vendorId}
              onChange={(e) => setProcForm({ ...procForm, vendorId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">Select Vendor</option>
              {vendors.map((v) => (<option key={v._id} value={v._id}>{v.name}</option>))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Order # *</label>
              <input
                type="text"
                required
                placeholder="PO-2026-XXXX"
                value={procForm.purchaseOrder}
                onChange={(e) => setProcForm({ ...procForm, purchaseOrder: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Cost (₹ INR)</label>
              <input
                type="number"
                value={procForm.purchaseCost}
                onChange={(e) => setProcForm({ ...procForm, purchaseCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Warranty Period (Months)</label>
            <input
              type="number"
              value={procForm.warrantyPeriod}
              onChange={(e) => setProcForm({ ...procForm, warrantyPeriod: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setProcModalOpen(false)} className="px-3 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold">
              {submitting ? 'Recording...' : 'Commit Purchase Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
