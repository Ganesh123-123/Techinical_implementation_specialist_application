import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Leads } from './pages/Leads';
import { Tasks } from './pages/Tasks';
import { Vendors } from './pages/Vendors';
import { Team } from './pages/Team';
import { AutomationWorkflow } from './pages/AutomationWorkflow';
import { DataCleaning } from './pages/DataCleaning';
import { ClickUpGuide } from './pages/ClickUpGuide';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/team" element={<Team />} />
          <Route path="/automation-workflow" element={<AutomationWorkflow />} />
          <Route path="/data-cleaning" element={<DataCleaning />} />
          <Route path="/clickup-guide" element={<ClickUpGuide />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
