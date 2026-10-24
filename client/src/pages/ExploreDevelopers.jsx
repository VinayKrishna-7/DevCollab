import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import DeveloperCard from '../components/DeveloperCard.jsx';
import SearchInput from '../components/SearchInput.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import Pagination from '../components/Pagination.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Users } from 'lucide-react';

const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' }
];

const AVAILABILITIES = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'LIMITED', label: 'Limited Availability' }
];

export default function ExploreDevelopers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [developers, setDevelopers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const experienceLevel = searchParams.get('experience') || '';
  const availability = searchParams.get('availability') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const fetchDevelopers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (experienceLevel) params.set('experienceLevel', experienceLevel);
      if (availability) params.set('availability', availability);
      params.set('page', page);
      params.set('limit', 12);

      const res = await api.get(`/users?${params.toString()}`);
      setDevelopers(res.data || []);
      if (res.meta?.pagination) {
        setPagination(res.meta.pagination);
      }
    } catch (err) {
      toast.error('Failed to load developers');
    } finally {
      setLoading(false);
    }
  }, [search, experienceLevel, availability, page, toast]);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage.toString());
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Discover Developer Teammates
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Find developers with complementary technical skills, aligned availability, and shared software interests.
        </p>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <SearchInput
          value={search}
          onChange={(val) => updateParam('search', val)}
          onClear={() => updateParam('search', '')}
          placeholder="Search developers by name, username, title, or bio..."
        />
      </div>

      <FilterPanel
        filters={{ experienceLevel, availability }}
        onFilterChange={(key, val) => {
          if (key === 'experienceLevel') updateParam('experience', val);
          else updateParam(key, val);
        }}
        onReset={() => setSearchParams(new URLSearchParams())}
        options={{
          experienceLevels: EXPERIENCE_LEVELS,
          availabilities: AVAILABILITIES
        }}
      />

      {loading ? (
        <SkeletonLoader count={6} height="240px" className="grid-cols-3" />
      ) : developers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No developers found"
          message="No developer profiles matched your query. Try clearing your search filters."
          action={
            <button onClick={() => setSearchParams(new URLSearchParams())} className="btn btn-secondary">
              Clear Filters
            </button>
          }
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {developers.map((dev) => (
              <DeveloperCard key={dev.id} developer={dev} />
            ))}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            totalItems={pagination.total}
          />
        </>
      )}
    </div>
  );
}
