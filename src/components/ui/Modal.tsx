import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, panelClassName = '' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className={`glass-panel relative flex max-h-[90vh] w-full max-w-5xl transform flex-col overflow-hidden rounded-2xl transition-all ${panelClassName}`}>
        <button 
          onClick={onClose}
          className="focus-ring absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          aria-label="Close"
        >
          ✕
        </button>
        <div className="overflow-y-auto flex-1 custom-scrollbar relative">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
