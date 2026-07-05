import React from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Modal } from '../ui/Modal';
import { OtpLoginForm } from '../auth/OtpLoginForm';
import { ProviderAuthPage } from '../../pages/public/ProviderAuthPage';
import { AdminAuthPage } from '../../pages/public/AdminAuthPage';

export const MainLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const loginType = searchParams.get('login');

  const closeLogin = () => {
    searchParams.delete('login');
    setSearchParams(searchParams, { replace: true });
  };
  return (
    <div className="app-shell min-h-screen flex flex-col pt-16">
      <TopBar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <footer className="mt-auto border-t border-slate-200/80 bg-white/75 py-6 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
          <span>&copy; {new Date().getFullYear()} ServiceMitra. All rights reserved.</span>
          <span className="font-medium text-slate-600">Trusted home services across Nepal</span>
        </div>
      </footer>

      {/* Auth Modals */}
      <Modal
        isOpen={loginType === 'customer'}
        onClose={closeLogin}
        panelClassName="max-w-md border-0 bg-transparent shadow-none backdrop-blur-0"
      >
        <OtpLoginForm />
      </Modal>

      <Modal isOpen={loginType === 'partner'} onClose={closeLogin}>
        <ProviderAuthPage />
      </Modal>

      <Modal isOpen={loginType === 'admin'} onClose={closeLogin}>
        <AdminAuthPage />
      </Modal>
    </div>
  );
};
