"use client";

import Image from "next/image";
import Header from "./Header";
import { useAuthValidation } from "@/hook/useAuthValidation";

interface AdminLayoutProps {
  children: React.ReactNode;
  showModelSelector?: boolean;
  currentModel?: string;
  onModelChange?: (model: string) => void;
  disabledModels?: string[];
}

export default function AdminLayout({
  children,
  showModelSelector = false,
  currentModel,
  onModelChange,
  disabledModels = [],
}: AdminLayoutProps) {
  useAuthValidation();

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/BG2.svg"
          alt="Background"
          fill
          className="object-cover"
        />
      </div>

      {/* Header */}
      <Header
        showModelSelector={showModelSelector}
        currentModel={currentModel}
        onModelChange={onModelChange}
        disabledModels={disabledModels}
      />

      {/* Main content */}
      <main className="relative z-10 pt-14 min-h-screen">
        <div className="max-w-425 px-10 lg:px-10 py-14 mx-auto">{children}</div>
      </main>
    </div>
  );
}
