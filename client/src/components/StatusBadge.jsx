import React from 'react';

const STATUS_CONFIGS = {
  // Recruitment Status
  RECRUITING: { label: 'Recruiting', variant: 'badge-success' },
  IN_PROGRESS: { label: 'In Progress', variant: 'badge-info' },
  COMPLETED: { label: 'Completed', variant: 'badge-primary' },
  DRAFT: { label: 'Draft', variant: 'badge-neutral' },
  ARCHIVED: { label: 'Archived', variant: 'badge-neutral' },

  // Task Status
  TODO: { label: 'To Do', variant: 'badge-neutral' },
  IN_REVIEW: { label: 'In Review', variant: 'badge-warning' },
  DONE: { label: 'Done', variant: 'badge-success' },
  BLOCKED: { label: 'Blocked', variant: 'badge-danger' },

  // Task Priority
  LOW: { label: 'Low', variant: 'badge-neutral' },
  MEDIUM: { label: 'Medium', variant: 'badge-info' },
  HIGH: { label: 'High', variant: 'badge-warning' },
  URGENT: { label: 'Urgent', variant: 'badge-danger' },

  // Application Status
  PENDING: { label: 'Pending', variant: 'badge-warning' },
  ACCEPTED: { label: 'Accepted', variant: 'badge-success' },
  REJECTED: { label: 'Rejected', variant: 'badge-danger' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'badge-neutral' },

  // Availability
  AVAILABLE: { label: 'Available', variant: 'badge-success' },
  LIMITED: { label: 'Limited', variant: 'badge-warning' },
  UNAVAILABLE: { label: 'Unavailable', variant: 'badge-danger' }
};

export default function StatusBadge({ status, customLabel }) {
  const config = STATUS_CONFIGS[status] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    variant: 'badge-neutral'
  };

  return (
    <span className={`badge ${config.variant}`}>
      {customLabel || config.label}
    </span>
  );
}
