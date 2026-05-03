import { HashRouter, Routes, Route } from 'react-router-dom';

import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Configurations from './pages/Configurations';
import Results from './pages/Results';
import StudentDetail from './pages/StudentDetail';
import Help from './pages/Help';

function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/results/:studentId" element={<StudentDetail />} />
          <Route path="/configurations" element={<Configurations />} />
          <Route path="/results" element={<Results />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}

export default App;
