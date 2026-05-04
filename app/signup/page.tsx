"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authAPI, authHelpers } from "@/lib/authApi";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.signup(
        formData.name,
        formData.email,
        formData.password,
      );

      if (response.success && response.data) {
        // Save token and role
        authHelpers.saveAuth(
          response.data.token,
          response.data.user.role,
          response.data.user.id,
        );

        // Redirect to chatbot (default for new users)
        router.push("/chat");
      }
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

          {/* Signup Form */}
          <div className="flex-1 max-w-md w-full space-y-8">
            <div>
              <h2 className="text-4xl text-center text-white mb-2">SIGN UP</h2>
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
                    htmlFor="name"
                    className="block text-xs text-gray-400 uppercase mb-2"
                  >
                    User Names
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="full name"
                  />
                </div>
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
                    Enter Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="••••••••••"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs text-gray-400 uppercase mb-2"
                  >
                    Enter Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
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
                  {loading ? "Signing up..." : "Sign up"}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-gray-400">or</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-pink-400 hover:text-pink-300"
                  >
                    Sign in
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
