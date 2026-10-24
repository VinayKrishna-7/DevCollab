import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/client.js';
import Modal from '../../components/Modal.jsx';
import FormField from '../../components/FormField.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/skills');
      setSkills(res.data || []);
    } catch (err) {
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleOpenCreate = () => {
    setEditingSkill(null);
    setName('');
    setCategory('General');
    setModalOpen(true);
  };

  const handleOpenEdit = (skill) => {
    setEditingSkill(skill);
    setName(skill.name);
    setCategory(skill.category || 'General');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      if (editingSkill) {
        await api.patch(`/skills/admin/${editingSkill.id}`, { name: name.trim(), category: category.trim() });
        toast.success('Skill updated');
      } else {
        await api.post('/skills/admin', { name: name.trim(), category: category.trim() });
        toast.success('Skill added to catalog');
      }
      setModalOpen(false);
      fetchSkills();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/skills/admin/${deleteTarget.id}`);
      toast.success('Skill deleted');
      setDeleteTarget(null);
      fetchSkills();
    } catch (err) {
      toast.error(err.message || 'Failed to delete skill');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            Platform Skills Catalog ({skills.length})
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Maintain normalized global skills used across user profiles, projects, and recommendation matching.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} /> Add New Skill
        </button>
      </div>

      {loading ? (
        <SkeletonLoader count={4} height="60px" />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <tr>
                <th style={{ padding: '0.85rem 1.25rem' }}>Skill Name</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Category</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {s.name}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span className="badge badge-neutral">{s.category || 'General'}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button onClick={() => handleOpenEdit(s)} className="btn btn-ghost btn-sm" aria-label="Edit skill">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(s)} className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} aria-label="Delete skill">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingSkill ? 'Edit Skill' : 'Add Catalog Skill'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Skill Name" name="name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="e.g. GraphQL, Tailwind CSS, Rust..."
              required
            />
          </FormField>

          <FormField label="Category" name="category">
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input"
              placeholder="e.g. Frontend, Backend, Database, Cloud..."
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingSkill ? 'Save Changes' : 'Create Skill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Skill"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from the global catalog?`}
        confirmText="Delete Skill"
        danger
        loading={deleting}
      />
    </div>
  );
}
