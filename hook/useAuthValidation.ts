"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { authAPI, authHelpers } from "@/lib/authApi";

const VALIDATION_INTERVAL_MS = 30_000;

export function useAuthValidation() {
    const pathname = usePathname();
    const lastValidatedAt = useRef<number>(0);
    const isValidating = useRef(false);

    const validate = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && now - lastValidatedAt.current < 5_000) return;
        if (isValidating.current) return;

        const token = authHelpers.getToken();
        if (!token) return;

        isValidating.current = true;

        try {
            const response = await authAPI.getMe();

            if (!response.success || !response.data?.user) {
                authHelpers.logout();
                return;
            }

            const serverUser = response.data.user;
            const storedRole = authHelpers.getRole();

            if (serverUser.role !== storedRole) {
                authHelpers.saveAuth(token, serverUser.role);
            }

            lastValidatedAt.current = now;
        } catch {

        } finally {
            isValidating.current = false;
        }
    }, []);

    useEffect(() => {
        validate();
    }, [pathname, validate]);

    useEffect(() => {
        const onFocus = () => validate();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [validate]);

    useEffect(() => {
        const interval = setInterval(() => validate(), VALIDATION_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [validate]);
}