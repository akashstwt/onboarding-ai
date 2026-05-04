"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Users,
  BarChart3,
  FileText,
  MessageSquare,
  Settings,
  Send,
  LogOut,
  Radio,
  Link2,
  UserCircle,
  Activity,
} from "lucide-react";
import { authHelpers, authAPI } from "@/lib/authApi";

interface HeaderProps {
  currentModel?: string;
  onModelChange?: (model: string) => void;
  showModelSelector?: boolean;
  disabledModels?: string[];
}

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface UserInfo {
  name: string | null;
  email: string;
}

const adminNavigationItems: NavigationItem[] = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/user-mappings", label: "User Mappings", icon: Users },
  { href: "/pulse", label: "Pulse", icon: Activity },
  { href: "/crla", label: "CRLA Dashboard", icon: BarChart3 },
  { href: "/prompts", label: "Prompts", icon: FileText },
  { href: "/telegram", label: "Telegram", icon: Send },
  { href: "/chat-link", label: "Chat Link", icon: Link2 },
  { href: "/broadcast", label: "Broadcast", icon: Radio },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/users", label: "Users", icon: Users },
];

export default function Header({
  currentModel,
  onModelChange,
  showModelSelector = false,
  disabledModels = [],
}: HeaderProps) {
  const pathname = usePathname();
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await authAPI.getMe();
        if (response.success && response.data?.user) {
          setUserInfo({
            name: response.data.user.name,
            email: response.data.user.email,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    authHelpers.logout();
  };

  const handleModelSelect = (model: string) => {
    if (disabledModels.includes(model)) return;
    if (onModelChange) onModelChange(model);
    setShowModelMenu(false);
  };

  const closeSidebar = () => setShowSidebar(false);

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-3 border-b border-primary-border backdrop-blur-sm">
        {/* Left Side */}
        <div className="relative">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg transition-all duration-300 hover:bg-white/10 border border-primary-border"
          >
            <div className="relative w-6 h-6">
              <Menu
                className={`h-6 w-6 absolute transition-all duration-300 ${
                  showSidebar ? "opacity-0 rotate-180" : "opacity-100 rotate-0"
                }`}
              />
              <X
                className={`h-6 w-6 absolute transition-all duration-300 ${
                  showSidebar ? "opacity-100 rotate-0" : "opacity-0 -rotate-180"
                }`}
              />
            </div>
          </button>
        </div>

        {/* Right Side - Model Selector or User Profile */}
        {showModelSelector && currentModel ? (
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="px-4 py-2 w-28 rounded-lg hover:bg-white/20 transition-colors border border-primary-border"
            >
              {currentModel}
            </button>

            {showModelMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowModelMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-36 bg-zinc-900 rounded-lg shadow-xl border border-primary-border overflow-hidden z-50">
                  {["GPT4", "Grok", "Claude", "Gemini"].map((model) => {
                    const isDisabled = disabledModels.includes(model);
                    const isActive = currentModel === model;
                    return (
                      <button
                        key={model}
                        onClick={() => handleModelSelect(model)}
                        disabled={isDisabled}
                        title={
                          isDisabled
                            ? "Limit reached for this model"
                            : undefined
                        }
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between gap-2
                          ${isActive ? "text-white bg-white/10" : "text-white/80"}
                          ${
                            isDisabled
                              ? "opacity-40 cursor-not-allowed line-through text-white/40"
                              : "hover:bg-white/10 cursor-pointer"
                          }`}
                      >
                        <span>{model}</span>
                        {isDisabled && (
                          <span className="text-[10px] text-red-400 font-medium leading-none shrink-0">
                            Limit reached
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <UserCircle className="w-6 h-6" />
            </button>

            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl rounded-lg shadow-xl border border-primary-border overflow-hidden z-50">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <UserCircle className="w-10 h-10 text-white/70" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {userInfo?.name || "User"}
                        </p>
                        <p className="text-xs text-white/60 truncate">
                          {userInfo?.email || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-red-400 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Backdrop */}
      <div
        className={`fixed top-0 left-0 right-0 bottom-0 z-40 bg-black/50 transition-opacity duration-300 ${
          showSidebar ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-20 left-10 bottom-10 w-62 bg-light-black backdrop-blur-2xl z-50 rounded-xl border border-primary-border transform transition-transform duration-300 ease-out flex flex-col justify-between ${
          showSidebar ? "translate-x-0" : "-translate-x-[calc(100%+3rem)]"
        }`}
      >
        <div className="overflow-y-auto p-2 gap-2 flex flex-col">
          {adminNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 uppercase font-light hover:bg-white/10 transition-colors group rounded-lg ${
                  isActive
                    ? "border border-gradient-primary text-white p-3"
                    : "text-white/60 px-3 py-2"
                }`}
              >
                {isActive && (
                  <span className="text-white rounded-md">
                    <Icon className="w-4 h-4" />
                  </span>
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="border-t border-white/10 p-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-red-400 w-full rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
