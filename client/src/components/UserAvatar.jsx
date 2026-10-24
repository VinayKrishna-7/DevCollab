import React from 'react';

export default function UserAvatar({ user, size = 'md', className = '' }) {
  const profile = user?.profile || user;
  const displayName = profile?.displayName || user?.username || 'User';
  const avatarUrl = profile?.avatarUrl;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`avatar avatar-${size} ${className}`}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className={`avatar avatar-${size} ${className}`} title={displayName}>
      {initials || '?'}
    </div>
  );
}
