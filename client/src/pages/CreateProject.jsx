import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, FolderGit2 } from 'lucide-react';
import api from '../api/client.js';
import FormField from '../components/FormField.jsx';
import SkillBadge from '../components/SkillBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';

const CATEGORIES = [
  { value: 'WEB_DEVELOPMENT', label: 'Web Development' },
  { value: 'MOBILE_DEVELOPMENT', label: 'Mobile Development' },
  { value: 'AI_ML', label: 'AI & Machine Learning' },
  { value: 'DATA_SCIENCE', label: 'Data Science' },
  { value: 'DEVTOOLS', label: 'Developer Tools' },
  { value: 'GAME_DEVELOPMENT', label: 'Game Development' },
  { value: 'CYBERSECURITY', label: 'Cybersecurity' },
  { value: 'OPEN_SOURCE', label: 'Open Source' },
  { value: 'OTHER', label: 'Other' }
];

const COLLAB_TYPES = [
  { value: 'PERSONAL_PROJECT', label: 'Personal Project' },
  { value: 'STARTUP', label: 'Startup Idea' },
  { value: 'OPEN_SOURCE', label: 'Open Source' },
  { value: 'HACKATHON', label: 'Hackathon' },
  { value: 'LEARNING', label: 'Learning & Mentorship' },
  { value: 'FREELANCE_COLLABORATION', label: 'Freelance Collaboration' }
];

export default function CreateProject() {
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    description: '',
    category: 'WEB_DEVELOPMENT',
    collaborationType: 'PERSONAL_PROJECT',
    recruitmentStatus: 'RECRUITING',
    desiredTeamSize: 3,
    expectedDuration: '1-3 months',
    repoUrl: '',
    demoUrl: '',
    skills: []
  });

  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    async function loadSkills() {
      try {
        const res = await api.get('/skills');
        setAllSkills(res.data || []);
      } catch (err) {
        // ignore
      }
    }
    loadSkills();
  }, []);

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
      skills: prev.skills.filter(id => id !== skillId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    try {
      const payload = {
        ...formData,
        repoUrl: formData.repoUrl || null,
        demoUrl: formData.demoUrl || null
      };

      const res = await api.post('/projects', payload);
      toast.success('Project published successfully!');
      navigate(`/projects/${res.data.slug}/workspace`);
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
      if (err.details) {
        const errorMap = {};
        for (const d of err.details) {
          errorMap[d.field] = d.message;
        }
        setFieldErrors(errorMap);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Publish a New Project Listing
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Describe your software concept, specify required technical skills, and begin recruiting collaborators.
        </p>
      </div>

      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <form onSubmit={handleSubmit}>
          <FormField label="Project Title" name="title" required error={fieldErrors.title}>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. Distributed Telemetry Pipeline"
              required
            />
          </FormField>

          <FormField
            label="Short Summary"
            name="summary"
            required
            error={fieldErrors.summary}
            hint="A clear 1-2 sentence pitch shown on project cards (10-250 chars)"
          >
            <input
              type="text"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              className="form-input"
              placeholder="Real-time analytics engine and dashboard tracking microservice velocity..."
              required
            />
          </FormField>

          <FormField
            label="Detailed Description"
            name="description"
            required
            error={fieldErrors.description}
            hint="Describe the problem, current architecture, deliverables, and role expectations"
          >
            <textarea
              name="description"
              rows={6}
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Explain the tech stack, goals, weekly commitments, and architecture in detail..."
              required
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <FormField label="Category" name="category" required>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Collaboration Type" name="collaborationType" required>
              <select
                name="collaborationType"
                value={formData.collaborationType}
                onChange={handleChange}
                className="form-select"
              >
                {COLLAB_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <FormField label="Desired Team Size" name="desiredTeamSize" required hint="Total members including yourself">
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

            <FormField label="Expected Duration" name="expectedDuration">
              <input
                type="text"
                name="expectedDuration"
                value={formData.expectedDuration}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 1-2 months or Ongoing"
              />
            </FormField>
          </div>

          {/* Technical Skills Required */}
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
                <option value="">Select a skill from catalog...</option>
                {allSkills.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
              <button type="button" onClick={handleAddSkill} className="btn btn-secondary">
                <Plus size={16} /> Add Skill
              </button>
            </div>

            {/* Selected Skills Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {formData.skills.map(id => {
                const skillObj = allSkills.find(s => s.id === id);
                return (
                  <SkillBadge
                    key={id}
                    skill={skillObj?.name || id}
                    onRemove={() => handleRemoveSkill(id)}
                  />
                );
              })}
              {formData.skills.length === 0 && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  No skills selected yet. Adding skills improves matching accuracy.
                </span>
              )}
            </div>
          </div>

          {/* External Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <FormField label="GitHub Repository URL" name="repoUrl">
              <input
                type="url"
                name="repoUrl"
                value={formData.repoUrl}
                onChange={handleChange}
                className="form-input"
                placeholder="https://github.com/org/repo"
              />
            </FormField>

            <FormField label="Demo URL" name="demoUrl">
              <input
                type="url"
                name="demoUrl"
                value={formData.demoUrl}
                onChange={handleChange}
                className="form-input"
                placeholder="https://demo.devcollab.io"
              />
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? 'Publishing Project...' : 'Publish Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
