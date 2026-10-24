import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, ArrowLeft } from 'lucide-react';
import api from '../api/client.js';
import FormField from '../components/FormField.jsx';
import SkillBadge from '../components/SkillBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useToast } from '../context/ToastContext.jsx';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'RECRUITING', label: 'Recruiting' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' }
];

export default function EditProject() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [projectSlug, setProjectSlug] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    description: '',
    category: 'WEB_DEVELOPMENT',
    recruitmentStatus: 'RECRUITING',
    desiredTeamSize: 3,
    expectedDuration: '',
    repoUrl: '',
    demoUrl: '',
    skills: []
  });

  const fetchProjectAndSkills = useCallback(async () => {
    setLoading(true);
    try {
      const [skillsRes, projRes] = await Promise.all([
        api.get('/skills'),
        api.get(`/projects/me/owned`)
      ]);
      setAllSkills(skillsRes.data || []);

      const target = (projRes.data || []).find(p => p.id === id);
      if (!target) {
        toast.error('Project not found or you are not the owner');
        navigate('/dashboard');
        return;
      }

      setProjectSlug(target.slug);
      setFormData({
        title: target.title,
        summary: target.summary,
        description: target.description,
        category: target.category,
        recruitmentStatus: target.recruitmentStatus,
        desiredTeamSize: target.desiredTeamSize,
        expectedDuration: target.expectedDuration || '',
        repoUrl: target.repoUrl || '',
        demoUrl: target.demoUrl || '',
        skills: (target.skills || []).map(s => s.skillId || s.skill?.id).filter(Boolean)
      });
    } catch (err) {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchProjectAndSkills();
  }, [fetchProjectAndSkills]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'desiredTeamSize' ? parseInt(value, 10) : value
    }));
  };

  const handleAddSkill = () => {
    if (!selectedSkillId) return;
    if (formData.skills.includes(selectedSkillId)) {
      toast.info('Skill already added');
      return;
    }
    setFormData(prev => ({ ...prev, skills: [...prev.skills, selectedSkillId] }));
    setSelectedSkillId('');
  };

  const handleRemoveSkill = (skillId) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(i => i !== skillId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        repoUrl: formData.repoUrl || null,
        demoUrl: formData.demoUrl || null
      };

      await api.patch(`/projects/${id}`, payload);

      // If status changed, update status endpoint
      await api.patch(`/projects/${id}/status`, { status: formData.recruitmentStatus }).catch(() => {});

      toast.success('Project updated successfully');
      navigate(`/projects/${projectSlug}/workspace`);
    } catch (err) {
      toast.error(err.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading project..." />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem' }}>
          Edit Project Settings
        </h1>

        <form onSubmit={handleSubmit}>
          <FormField label="Project Title" name="title" required>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </FormField>

          <FormField label="Short Summary" name="summary" required>
            <input
              type="text"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              className="form-input"
              required
            />
          </FormField>

          <FormField label="Detailed Description" name="description" required>
            <textarea
              name="description"
              rows={6}
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              required
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <FormField label="Recruitment Status" name="recruitmentStatus" required>
              <select
                name="recruitmentStatus"
                value={formData.recruitmentStatus}
                onChange={handleChange}
                className="form-select"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Desired Team Size" name="desiredTeamSize" required>
              <input
                type="number"
                name="desiredTeamSize"
                min="1"
                max="20"
                value={formData.desiredTeamSize}
                onChange={handleChange}
                className="form-input"
                required
              />
            </FormField>
          </div>

          {/* Skills */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
              Required Technical Skills
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="form-select"
                style={{ flex: 1 }}
              >
                <option value="">Select skill from catalog...</option>
                {allSkills.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button type="button" onClick={handleAddSkill} className="btn btn-secondary">
                <Plus size={16} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {formData.skills.map(skillId => {
                const skillObj = allSkills.find(s => s.id === skillId);
                return (
                  <SkillBadge
                    key={skillId}
                    skill={skillObj?.name || skillId}
                    onRemove={() => handleRemoveSkill(skillId)}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
