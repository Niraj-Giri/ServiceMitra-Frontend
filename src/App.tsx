import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AuthGuard } from './components/layout/AuthGuard';
import { useAuth } from './hooks/useAuth';

// Lazy loading pages can be done here.
import { OtpLoginForm } from './components/auth/OtpLoginForm';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { ProviderDashboard } from './pages/provider/ProviderDashboard';
import { ProviderJobDetail } from './pages/provider/ProviderJobDetail';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { HomePage } from './pages/public/HomePage';
import { ProviderAuthPage } from './pages/public/ProviderAuthPage';
import { AdminAuthPage } from './pages/public/AdminAuthPage';
import { UnauthorizedPage } from './pages/common/UnauthorizedPage';
import { ProfilePage } from './pages/common/ProfilePage';
import { CategoryList } from './pages/customer/CategoryList';
import { ServiceDetail } from './pages/customer/ServiceDetail';
import { BookingTracking } from './pages/customer/BookingTracking';
import { PostTask } from './pages/customer/PostTask';
import { TaskDetail } from './pages/customer/TaskDetail';

const App: React.FC = () => {
  const { fetchUser, isAuthenticated } = useAuth();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="partner/login" element={<ProviderAuthPage />} />
          <Route path="admin/login" element={<AdminAuthPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />
          <Route path="services" element={<CategoryList />} />
          <Route path="services/:id" element={<ServiceDetail />} />
          
          <Route path="login" element={
            isAuthenticated ? <Navigate to="/" /> : 
            <div className="flex justify-center items-center min-h-[60vh]">
              <OtpLoginForm />
            </div>
          } />

          <Route element={<AuthGuard />}>
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route element={<AuthGuard allowedRoles={['CUSTOMER']} />}>
            <Route path="customer/dashboard" element={<CustomerDashboard />} />
            <Route path="task/new" element={<PostTask />} />
            <Route path="task/:taskId" element={<TaskDetail />} />
            <Route path="tracking/:bookingId" element={<BookingTracking />} />
          </Route>

          <Route element={<AuthGuard allowedRoles={['PROVIDER']} />}>
            <Route path="provider/dashboard" element={<ProviderDashboard />} />
            <Route path="provider/job/:bookingId" element={<ProviderJobDetail />} />
          </Route>
          
          <Route element={<AuthGuard allowedRoles={['ADMIN']} />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
