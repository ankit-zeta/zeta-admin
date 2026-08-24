"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useAction } from "convex/react";
import { api } from "@/lib/convex";
import { useAdminAuth } from "@/lib/convex";
import { Shield, Lock, Mail, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const loginAction = useAction(api.auth.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await loginAction({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!["super_admin", "admin", "content_admin", "finance_admin", "work_admin"].includes(res.user.role)) {
        throw new Error("Access Denied: You do not have administrator permissions.");
      }

      login(res.token);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Invalid administrative credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-neutral-900 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-lg">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          ZetaGrow Admin Panel
        </h1>
        <p className="text-xs text-neutral-400">
          Secure operational gateway for platform administrators.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-8 space-y-6 shadow-2xl">
          {error && (
            <div className="p-3 rounded-lg bg-red-900/50 border border-red-700 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@zetagrow.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-700 text-xs bg-neutral-900 text-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-700 text-xs bg-neutral-900 text-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-2.5 text-xs font-semibold shadow-md mt-2 bg-brand-600 hover:bg-brand-500"
            >
              {isLoading ? "Authenticating..." : "Sign In to Admin Panel"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
