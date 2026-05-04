"use client";

import { AlertTriangle, Info } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantConfig = {
    danger: {
      icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
      buttonClass: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
      buttonClass: "bg-yellow-600 hover:bg-yellow-700",
    },
    info: {
      icon: <Info className="w-12 h-12 text-blue-500" />,
      buttonClass: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const config = variantConfig[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
      <div className="flex min-h-screen items-center justify-center p-4 w-full">
        <div className="fixed inset-0 cursor-pointer" onClick={onClose} />
        <div className="relative w-full max-w-md bg-light-black border-2 border-white/20 rounded-2xl shadow-2xl">
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">{config.icon}</div>
              <h2 className="text-2xl font-semibold text-white mb-3">
                {title}
              </h2>
              <p className="text-white/70 mb-6">{message}</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-all ${config.buttonClass}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
