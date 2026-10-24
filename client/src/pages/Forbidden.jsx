import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function Forbidden() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'var(--danger-light)',
        border: '1px solid var(--danger-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.25rem'
      }}>
        <ShieldX size={32} color="var(--danger)" />
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger-text)', marginBottom: '0.5rem' }}>Access Forbidden (403)</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '450px', marginBottom: '1.75rem' }}>
        You do not have the required permissions to access this private resource or administrative area.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        <ArrowLeft size={16} /> Go to Dashboard
      </Link>
    </div>
  );
}
