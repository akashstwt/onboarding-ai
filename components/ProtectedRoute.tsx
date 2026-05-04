"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI, authHelpers } from "@/lib/authApi";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();

  const [status, setStatus] = useState<"pending" | "valid" | "invalid">(
    "pending",
  );

  useEffect(() => {
    // Check if user is authenticated
    if (!authHelpers.isAuthenticated()) {
      router.replace("/login");
      return;
    }

    authAPI
      .getMe()
      .then((res) => {
        if (!res.success || !res.data?.user) {
          authHelpers.logout();
          return;
        }

        const serverUser = res.data.user;
        authHelpers.saveAuth(authHelpers.getToken()!, serverUser.role);

        setStatus("valid");
      })
      .catch(() => {
        setStatus("invalid");
      });
  }, [router]);

  if (status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") return null;

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function UserRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
