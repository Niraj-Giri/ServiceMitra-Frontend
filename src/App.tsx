import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { CustomerDashboard } from './components/CustomerDashboard';

import { ProviderDashboard } from './pages/ProviderDashboard';
import { AdminPortal } from './pages/AdminPortal';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/provider" element={<ProviderDashboard />} />
          <Route path="/admin" element={<AdminPortal />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

