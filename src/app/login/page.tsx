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
      // Collect client metadata for login audit
      let ip = "";
      let location = "";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ip = ipData.ip || "";
        if (ip) {
          try {
            const locRes = await fetch(`https://ipapi.co/${ip}/json/`);
            const locData = await locRes.json();
            location = [locData.city, locData.region, locData.country_name].filter(Boolean).join(", ");
          } catch {}
        }
      } catch {}

      const ua = navigator.userAgent;
      const deviceType = /Mobi|Android|iPhone/i.test(ua) ? "mobile" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop";
      const deviceOS = /Win/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : "Unknown";
      const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|Brave)\/[\d.]+/);
      const deviceBrowser = browserMatch ? browserMatch[1] : "Unknown";

      const res = await loginAction({
        email: email.trim().toLowerCase(),
        password,
        ip: ip || undefined,
        userAgent: ua || undefined,
        deviceType,
        deviceOS,
        deviceBrowser,
        location: location || undefined,
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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-bgWarm text-textMain">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-textMain">
          ZetaGrow Admin Panel
        </h1>
        <p className="text-xs text-textMuted">
          Secure operational gateway for platform administrators.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-borderSubtle rounded-xl p-8 space-y-6 shadow-sm">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-textMuted">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@zetagrow.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white text-textMain placeholder:text-neutral-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-textMuted">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white text-textMain placeholder:text-neutral-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-2.5 text-xs font-semibold shadow-sm mt-2 bg-brand-600 hover:bg-brand-700"
            >
              {isLoading ? "Authenticating..." : "Sign In to Admin Panel"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
