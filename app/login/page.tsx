"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authAPI, authHelpers } from "@/lib/authApi";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authAPI.login(formData.email, formData.password);

      if (result.success && result.data) {
        authHelpers.saveAuth(
          result.data.token,
          result.data.user.role,
          result.data.user.id,
        );

        router.push("/chat");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/Bg.png"
          alt="Background"
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl flex items-center gap-12 lg:gap-20">
          {/* Decorative Image */}
          <div className="hidden lg:block flex-1">
            <Image
              src="/images/login.png"
              alt="Decorative"
              width={500}
              height={100}
              className=" rounded-2xl"
            />
          </div>

          {/* Login Form */}
          <div className="flex-1 max-w-md w-full space-y-8">
            <div>
              <h2 className="text-4xl text-center text-white mb-2">SIGN IN</h2>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4">
                  <div className="text-sm text-red-200">{error}</div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs text-gray-400 uppercase mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="youremail@gmail.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs text-gray-400 uppercase mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="••••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 border-2 text-base font-medium rounded-lg text-pink-600 bg-white hover:bg-pink-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>

              <div className="bg-black/25 border border-white/10 rounded-lg p-3 text-xs text-gray-300">
                <p className="mb-1">Demo credentials:</p>
                <p>Email: alex.chen@example.com</p>
                <p>Password: password123</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Do not have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-pink-400 hover:text-pink-300"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
