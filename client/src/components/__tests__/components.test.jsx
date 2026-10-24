import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import StatusBadge from '../StatusBadge.jsx';
import SkillBadge from '../SkillBadge.jsx';
import EmptyState from '../EmptyState.jsx';
import Logo from '../Logo.jsx';

describe('Reusable UI Components (Server Rendering & Contract)', () => {
  it('renders Logo with SVG vector and optional brand name', () => {
    const htmlWithText = renderToString(<Logo size={32} showText={true} />);
    expect(htmlWithText).toContain('DevCollab');
    expect(htmlWithText).toContain('<svg');
    expect(htmlWithText).toContain('aria-label="DevCollab Logo"');

    const htmlIconOnly = renderToString(<Logo size={28} showText={false} />);
    expect(htmlIconOnly).toContain('<svg');
    expect(htmlIconOnly).not.toContain('DevCollab</span>');
  });

  it('renders StatusBadge with proper label and class', () => {
    const html = renderToString(<StatusBadge status="RECRUITING" />);
    expect(html).toContain('Recruiting');
    expect(html).toContain('badge-success');
  });

  it('renders SkillBadge with skill name and proficiency', () => {
    const html = renderToString(<SkillBadge skill="React" proficiency="EXPERT" matched={true} />);
    expect(html).toContain('React');
    expect(html).toContain('skill-badge-matched');
    expect(html).toContain('E'); // First letter of EXPERT
  });

  it('renders EmptyState with custom title and message', () => {
    const html = renderToString(
      <EmptyState title="No Projects Found" message="Try searching for something else." />
    );
    expect(html).toContain('No Projects Found');
    expect(html).toContain('Try searching for something else.');
  });
});
