import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopNavigation from './TopNavigation.jsx';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <TopNavigation />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
