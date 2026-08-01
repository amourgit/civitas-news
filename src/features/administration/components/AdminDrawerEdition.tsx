import React from 'react';
import { X } from 'lucide-react';

export interface AdminDrawerEditionProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const AdminDrawerEdition: React.FC<AdminDrawerEditionProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1A1F4D] h-full shadow-2xl z-10 flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800 mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};
