import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/auth.store";

export default function Login() {
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("admin@erp.com");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password");
      return;
    }

    try {
      setLoading(true);

      await login(email.trim(), password);

      toast.success("Welcome back!");

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">

        {/* =====================================================
            LEFT BRAND PANEL
        ===================================================== */}

        <section className="relative hidden overflow-hidden border-r border-white/[0.06] lg:flex">
          <div className="flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-sm font-black text-black">
                  ERP
                </div>

                <div>
                  <p className="text-sm font-semibold tracking-tight text-white">
                    VertexERP 
                  </p>

                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                    Business Management
                  </p>
                </div>
              </div>
            </div>

            {/* Main message */}
            <div className="max-w-xl">

              <div className="mb-6 h-px w-12 bg-amber-400" />

              <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-6xl">
                Run your
                <br />
                business
                <br />
                <span className="text-amber-400">
                  smarter.
                </span>
              </h1>

              <p className="mt-7 max-w-md text-sm leading-6 text-zinc-500">
                Manage customers, products, inventory,
                sales and follow-ups from one centralized
                business platform.
              </p>

              {/* Feature list */}
              <div className="mt-10 grid max-w-lg grid-cols-2 gap-x-8 gap-y-5">

                <Feature
                  title="Customer Management"
                  description="CRM and follow-ups"
                />

                <Feature
                  title="Inventory Control"
                  description="Products and stock"
                />

                <Feature
                  title="Sales Operations"
                  description="Challans and orders"
                />

                <Feature
                  title="Business Insights"
                  description="Clear operational data"
                />

              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-5">
              <p className="text-[11px] text-zinc-700">
                VertexERP  CRM
              </p>

              <p className="text-[11px] text-zinc-700">
                Business Operations Platform
              </p>
            </div>

          </div>

          {/* Very subtle accent line */}
          <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-amber-400/70" />
        </section>

        {/* =====================================================
            RIGHT LOGIN PANEL
        ===================================================== */}

        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">

          <div className="w-full max-w-[420px]">

            {/* Mobile branding */}
            <div className="mb-12 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-sm font-black text-black">
                ERP
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  VertexERP 
                </p>

                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                  Business Management
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-9">

              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                Welcome back
              </p>

              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                Sign in to your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Enter your credentials to access your
                business dashboard.
              </p>

            </div>

            {/* Login form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-medium text-zinc-400"
                >
                  Email address
                </label>

                <div className="relative">

                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="admin@erp.com"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-lg border border-white/[0.09] bg-[#111111] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-700 hover:border-white/[0.14] focus:border-amber-400/60 focus:bg-[#131313] focus:ring-1 focus:ring-amber-400/10"
                  />

                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="text-xs font-medium text-zinc-400"
                  >
                    Password
                  </label>

                </div>

                <div className="relative">

                  <Lock
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="h-12 w-full rounded-lg border border-white/[0.09] bg-[#111111] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-700 hover:border-white/[0.14] focus:border-amber-400/60 focus:bg-[#131313] focus:ring-1 focus:ring-amber-400/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-600 transition hover:text-zinc-300"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in

                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>

            </form>

            {/* Demo credentials */}
            <div className="mt-8 border-t border-white/[0.06] pt-6">

              <div className="flex items-start gap-3">

                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />

                <div>
                  <p className="text-xs font-medium text-zinc-400">
                    Demo account
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    admin@erp.com
                    <span className="mx-2 text-zinc-800">
                      •
                    </span>
                    Admin@123
                  </p>
                </div>

              </div>

            </div>

            {/* Mobile footer */}
            <p className="mt-12 text-center text-[10px] uppercase tracking-[0.15em] text-zinc-700 lg:hidden">
              VertexERP  CRM
            </p>

          </div>
        </section>

      </div>
    </main>
  );
}

/* =========================================================
   FEATURE ITEM
========================================================= */

type FeatureProps = {
  title: string;
  description: string;
};

function Feature({
  title,
  description,
}: FeatureProps) {
  return (
    <div className="border-l border-white/[0.08] pl-4">
      <p className="text-xs font-medium text-zinc-300">
        {title}
      </p>

      <p className="mt-1 text-[11px] text-zinc-600">
        {description}
      </p>
    </div>
  );
}