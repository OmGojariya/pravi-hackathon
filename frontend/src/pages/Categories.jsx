import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Layers,
  CheckCircle2,
  Tag,
} from 'lucide-react';

export const Categories = () => {
  const { hasRole } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', subcategories: '' });
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.success) setCategories(res.data || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', code: '', description: '', subcategories: '' });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      code: cat.code,
      description: cat.description || '',
      subcategories: cat.subcategories?.join(', ') || '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description,
        subcategories: formData.subcategories
          ? formData.subcategories.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, payload);
      } else {
        await api.post('/categories', payload);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
            Asset Categories & Subcategories
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamic asset classification taxonomy (Requirement #2). Administrators can create custom categories.
          </p>
        </div>

        {hasRole('SUPER_ADMIN', 'ADMIN') && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Asset Category</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading categories...</div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-brand-200 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-brand-50 text-brand-700 border border-brand-100">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                      <span className="font-mono text-xs font-bold text-brand-700">{cat.code}</span>
                    </div>
                  </div>

                  {hasRole('SUPER_ADMIN', 'ADMIN') && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {cat.description || 'Infrastructure category.'}
                </p>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Subcategories ({cat.subcategories?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subcategories?.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        <span>{sub}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Classification</span>
                </span>
                <Link
                  to={`/assets?category=${cat._id}`}
                  className="text-brand-600 font-semibold hover:underline"
                >
                  View Assets →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Asset Category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">{error}</div>}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Urban Drainage"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Code (Prefix for Asset IDs) *</label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="e.g. DRN, ROAD, BRG"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Subcategories (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Drain, Stormwater System, Sewer Line, Culvert"
              value={formData.subcategories}
              onChange={(e) => setFormData({ ...formData, subcategories: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3 py-2 border rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
