"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
      <div className="flex min-h-screen items-center justify-center p-4 w-full">
        <div className="fixed inset-0 cursor-pointer" onClick={onClose} />
        <div
          className={`relative w-full ${sizeClasses[size]} bg-light-black border border-white/10 rounded-2xl shadow-2xl mt-10`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 className="text-2xl uppercase text-white tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-primary-text transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-pink-500"
              aria-label="Close modal"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
          <div className="p-6 text-white">{children}</div>
        </div>
      </div>
    </div>
  );
}
