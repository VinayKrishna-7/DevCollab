import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, User, ShieldCheck } from 'lucide-react';
import api from '../api/client.js';
import FormField from '../components/FormField.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' }
];

const AVAILABILITY_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available (Actively Looking)' },
  { value: 'LIMITED', label: 'Limited Availability' },
  { value: 'UNAVAILABLE', label: 'Currently Unavailable' }
];

const COLLAB_TYPES = [
  { value: 'PERSONAL_PROJECT', label: 'Personal Project' },
  { value: 'STARTUP', label: 'Startup Idea' },
  { value: 'OPEN_SOURCE', label: 'Open Source' },
  { value: 'HACKATHON', label: 'Hackathon' },
  { value: 'LEARNING', label: 'Learning & Mentorship' },
  { value: 'FREELANCE_COLLABORATION', label: 'Freelance Collaboration' }
];

const PROFICIENCY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

export default function ProfileEdit() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);

  // Profile fields
  const [profileData, setProfileData] = useState({
    displayName: '',
    headline: '',
    bio: '',
    avatarUrl: '',
    location: '',
    experienceLevel: 'BEGINNER',
    availability: 'AVAILABLE',
    weeklyHours: 10,
    timezone: '',
    collaborationType: 'PERSONAL_PROJECT',
    areasOfInterest: [],
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    visibility: 'PUBLIC'
  });

  const [interestInput, setInterestInput] = useState('');

  // Skills Catalog & User Skills
  const [allCatalogSkills, setAllCatalogSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [selectedCatalogSkillId, setSelectedCatalogSkillId] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('INTERMEDIATE');
  const [selectedYears, setSelectedYears] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, skillsRes, catalogRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users/me/skills'),
        api.get('/skills')
      ]);

      const prof = profileRes.data?.profile || {};
      setProfileData({
        displayName: prof.displayName || profileRes.data?.username || '',
        headline: prof.headline || '',
        bio: prof.bio || '',
        avatarUrl: prof.avatarUrl || '',
        location: prof.location || '',
        experienceLevel: prof.experienceLevel || 'BEGINNER',
        availability: prof.availability || 'AVAILABLE',
        weeklyHours: prof.weeklyHours || 10,
        timezone: prof.timezone || '',
        collaborationType: prof.collaborationType || 'PERSONAL_PROJECT',
        areasOfInterest: prof.areasOfInterest || [],
        githubUrl: prof.githubUrl || '',
        linkedinUrl: prof.linkedinUrl || '',
        portfolioUrl: prof.portfolioUrl || '',
        visibility: prof.visibility || 'PUBLIC'
      });

      setUserSkills(skillsRes.data || []);
      setAllCatalogSkills(catalogRes.data || []);
    } catch (err) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: name === 'weeklyHours' ? parseInt(value, 10) : value
    }));
  };

  const handleAddInterest = () => {
    if (!interestInput.trim()) return;
    if (profileData.areasOfInterest.includes(interestInput.trim())) {
      setInterestInput('');
      return;
    }
    setProfileData(prev => ({
      ...prev,
      areasOfInterest: [...prev.areasOfInterest, interestInput.trim()]
    }));
    setInterestInput('');
  };

  const handleRemoveInterest = (item) => {
    setProfileData(prev => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.filter(i => i !== item)
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        ...profileData,
        avatarUrl: profileData.avatarUrl || null,
        githubUrl: profileData.githubUrl || null,
        linkedinUrl: profileData.linkedinUrl || null,
        portfolioUrl: profileData.portfolioUrl || null
      };

      const res = await api.patch('/users/me', payload);
      toast.success('Developer profile updated successfully');
      if (res.data?.profile) {
        updateUser(res.data.profile);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddUserSkill = () => {
    if (!selectedCatalogSkillId) return;

    if (userSkills.some(s => s.skillId === selectedCatalogSkillId || s.skill?.id === selectedCatalogSkillId)) {
      toast.info('You already added this skill');
      return;
    }

    const skillObj = allCatalogSkills.find(s => s.id === selectedCatalogSkillId);
    setUserSkills(prev => [
      ...prev,
      {
        skillId: selectedCatalogSkillId,
        skill: skillObj,
        proficiency: selectedProficiency,
        yearsOfExperience: parseInt(selectedYears, 10)
      }
    ]);

    setSelectedCatalogSkillId('');
  };

  const handleRemoveUserSkill = (skillId) => {
    setUserSkills(prev => prev.filter(s => (s.skillId || s.skill?.id) !== skillId));
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const payload = {
        skills: userSkills.map(s => ({
          skillId: s.skillId || s.skill?.id,
          proficiency: s.proficiency || 'INTERMEDIATE',
          yearsOfExperience: s.yearsOfExperience || 1
        }))
      };

      await api.put('/users/me/skills', payload);
      toast.success('Technical skills saved successfully');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save skills');
    } finally {
      setSavingSkills(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading profile editor..." />;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Edit Developer Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Keep your skills, experience level, and availability updated to match with the best software projects.
        </p>
      </div>

      {/* Profile Form */}
      <div className="card" style={{ padding: '2.5rem 2rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
          Personal & Professional Information
        </h2>

        <form onSubmit={handleSaveProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <FormField label="Display Name" name="displayName" required>
              <input
                type="text"
                name="displayName"
                value={profileData.displayName}
                onChange={handleProfileChange}
                className="form-input"
                required
              />
            </FormField>

            <FormField label="Headline" name="headline" hint="e.g. Senior Full-Stack Engineer | React & Go">
              <input
                type="text"
                name="headline"
                value={profileData.headline}
                onChange={handleProfileChange}
                className="form-input"
                placeholder="Senior Full-Stack Engineer"
              />
            </FormField>
          </div>

          <FormField label="Biography" name="bio" hint="Share your background, technical focus, and what projects excite you">
            <textarea
              name="bio"
              rows={4}
              value={profileData.bio}
              onChange={handleProfileChange}
              className="form-textarea"
              placeholder="Tell other developers about your software engineering journey..."
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <FormField label="Location" name="location" hint="e.g. San Francisco, CA or Remote">
              <input
                type="text"
                name="location"
                value={profileData.location}
                onChange={handleProfileChange}
                className="form-input"
                placeholder="City, Country"
              />
            </FormField>

            <FormField label="Avatar Image URL" name="avatarUrl">
              <input
                type="url"
                name="avatarUrl"
                value={profileData.avatarUrl}
                onChange={handleProfileChange}
                className="form-input"
                placeholder="https://images.unsplash.com/..."
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
            <FormField label="Experience Level" name="experienceLevel" required>
              <select
                name="experienceLevel"
                value={profileData.experienceLevel}
                onChange={handleProfileChange}
                className="form-select"
              >
                {EXPERIENCE_LEVELS.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Availability" name="availability" required>
              <select
                name="availability"
                value={profileData.availability}
                onChange={handleProfileChange}
                className="form-select"
              >
                {AVAILABILITY_OPTIONS.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Weekly Hours" name="weeklyHours" hint="Hours available to commit">
              <input
                type="number"
                name="weeklyHours"
                min="1"
                max="80"
                value={profileData.weeklyHours}
                onChange={handleProfileChange}
                className="form-input"
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <FormField label="Preferred Collaboration Type" name="collaborationType">
              <select
                name="collaborationType"
                value={profileData.collaborationType}
                onChange={handleProfileChange}
                className="form-select"
              >
                {COLLAB_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Profile Visibility" name="visibility">
              <select
                name="visibility"
                value={profileData.visibility}
                onChange={handleProfileChange}
                className="form-select"
              >
                <option value="PUBLIC">Public (Discoverable in Directory)</option>
                <option value="PRIVATE">Private (Only Accessible to Team)</option>
              </select>
            </FormField>
          </div>

          {/* Areas of Interest */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem' }}>
              Areas of Interest & Focus
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="e.g. Web Development, AI/ML, DevTools, Distributed Systems..."
                className="form-input"
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
              />
              <button type="button" onClick={handleAddInterest} className="btn btn-secondary">
                <Plus size={16} /> Add Interest
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {profileData.areasOfInterest.map((item) => (
                <span
                  key={item}
                  className="badge badge-info"
                  style={{ padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(item)}
                    style={{ color: 'var(--primary)', cursor: 'pointer', lineHeight: 1 }}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* External Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
            <FormField label="GitHub Profile URL" name="githubUrl">
              <input
                type="url"
                name="githubUrl"
                value={profileData.githubUrl}
                onChange={handleProfileChange}
                className="form-input"
                placeholder="https://github.com/..."
              />
            </FormField>

            <FormField label="LinkedIn URL" name="linkedinUrl">
              <input
                type="url"
                name="linkedinUrl"
                value={profileData.linkedinUrl}
                onChange={handleProfileChange}
                className="form-input"
                placeholder="https://linkedin.com/in/..."
              />
            </FormField>

            <FormField label="Portfolio URL" name="portfolioUrl">
              <input
                type="url"
                name="portfolioUrl"
                value={profileData.portfolioUrl}
                onChange={handleProfileChange}
                className="form-input"
                placeholder="https://mywebsite.dev"
              />
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={savingProfile}>
              <Save size={16} /> {savingProfile ? 'Saving...' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      </div>

      {/* Normalized Technical Skills Manager */}
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Technical Skills & Proficiencies
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Associate verified skills from our platform catalog to power recommendations.
            </p>
          </div>

          <button onClick={handleSaveSkills} className="btn btn-primary" disabled={savingSkills}>
            <Save size={15} /> {savingSkills ? 'Saving...' : 'Save Skills Changes'}
          </button>
        </div>

        {/* Add Skill Form */}
        <div style={{
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-light)',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr auto',
          gap: '1rem',
          alignItems: 'flex-end'
        }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem', display: 'block' }}>
              Select Skill from Catalog
            </label>
            <select
              value={selectedCatalogSkillId}
              onChange={(e) => setSelectedCatalogSkillId(e.target.value)}
              className="form-select"
            >
              <option value="">Choose skill (e.g. React, PostgreSQL, Docker)...</option>
              {allCatalogSkills.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem', display: 'block' }}>
              Proficiency
            </label>
            <select
              value={selectedProficiency}
              onChange={(e) => setSelectedProficiency(e.target.value)}
              className="form-select"
            >
              {PROFICIENCY_LEVELS.map(lvl => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem', display: 'block' }}>
              Years of Exp.
            </label>
            <input
              type="number"
              min="0"
              max="40"
              value={selectedYears}
              onChange={(e) => setSelectedYears(e.target.value)}
              className="form-input"
            />
          </div>

          <button type="button" onClick={handleAddUserSkill} className="btn btn-secondary" style={{ height: '38px' }}>
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Current User Skills List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {userSkills.map((s) => {
            const skillName = s.skill?.name || 'Skill';
            const skillId = s.skillId || s.skill?.id;

            return (
              <div
                key={skillId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', minWidth: '150px' }}>
                    {skillName}
                  </span>

                  <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                    {s.proficiency}
                  </span>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {s.yearsOfExperience} {s.yearsOfExperience === 1 ? 'year' : 'years'} exp
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveUserSkill(skillId)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)' }}
                  aria-label="Remove skill"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}

          {userSkills.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No technical skills listed yet. Add skills above to receive relevant project recommendations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
