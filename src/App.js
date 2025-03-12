import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import Performance from './pages/Performance';
import Settings from './pages/Settings';
import ApplicationForm from './pages/ApplicationForm.js'
import Submissions from './pages/Submissions';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatRoutes: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/applicationform" element={<ApplicationForm />} />
        <Route path="/submissions" element={<Submissions />} />
      </Routes>
    </Router>
  );
}

export default App;

