import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#21165c]">

      {/* Background glow */}
      <div className="absolute -left-40 -bottom-40 h-[550px] w-[550px] rounded-full bg-[#6453df]/40 blur-3xl" />

      <div className="absolute -right-40 -top-40 h-[650px] w-[650px] rounded-full bg-[#7161ed]/30 blur-3xl" />

      {/* Decorative geometric shapes */}
      <div className="absolute right-[-180px] top-[-150px] h-[600px] w-[600px] rotate-[25deg] bg-white/[0.04]" />

      <div className="absolute bottom-[-300px] right-[-100px] h-[600px] w-[600px] rounded-full border border-white/[0.05]" />

      {/* Main container */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-5 sm:p-8">

        <div className="grid w-full max-w-[1010px] overflow-hidden rounded-[28px] border border-white/15 shadow-[0_40px_100px_rgba(0,0,0,0.35)] lg:grid-cols-2">

          {/* ================================================= */}
          {/* LEFT SIDE */}
          {/* ================================================= */}

          <div className="hidden min-h-[580px] flex-col justify-center bg-gradient-to-br from-[#4a3a9e]/90 to-[#24185f]/95 p-10 text-white backdrop-blur-xl sm:p-12 lg:flex">

            {/* Badge */}
            <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-[13px] text-[#d8d4ff]">

              <span className="h-2 w-2 rounded-full bg-[#62e6a5] shadow-[0_0_10px_#62e6a5]" />

              Autonomous Cash Flow Intelligence

            </div>

            {/* Heading */}
            <h1 className="text-[44px] font-bold leading-[1.05] tracking-[-2px] xl:text-[56px]">

              Get paid faster.

              <br />

              <span className="font-serif font-normal italic">
                Worry a lot less.
              </span>

            </h1>

            {/* Description */}
            <p className="mt-7 max-w-[430px] text-[15px] leading-7 text-white/70">

              CashGuard AI watches every invoice, predicts risk before it
              happens, and nudges clients on your behalf — so your cash flow
              runs itself.

            </p>

            {/* Stats */}
            <div className="mt-11 flex gap-8 xl:gap-10">

              <div>
                <p className="text-xl font-bold">
                  ₹12.4L+
                </p>

                <p className="mt-1 text-xs text-white/50">
                  Tracked monthly
                </p>
              </div>

              <div>
                <p className="text-xl font-bold">
                  7 days
                </p>

                <p className="mt-1 text-xs text-white/50">
                  Faster collections
                </p>
              </div>

              <div>
                <p className="text-xl font-bold">
                  92%
                </p>

                <p className="mt-1 text-xs text-white/50">
                  Fraud catch rate
                </p>
              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* RIGHT SIDE */}
          {/* ================================================= */}

          <div className="flex min-h-[580px] items-center justify-center bg-white px-7 py-10 sm:px-12">

            <div className="w-full max-w-[410px]">

              {/* Logo */}
              <div className="mb-12 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#7561ee] to-[#5742d5] text-white shadow-lg shadow-purple-500/20">

                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 3L20 6V11C20 16.5 16.5 20 12 21C7.5 20 4 16.5 4 11V6L12 3Z" />
                    <path d="M9 12L11 14L15 10" />
                  </svg>

                </div>

                <span className="text-xl font-bold text-[#20202b]">
                  CashGuard AI
                </span>

              </div>

              {/* Heading */}
              <div className="mb-7">

                <h2 className="text-[29px] font-bold tracking-[-0.7px] text-[#171721]">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm text-[#9b9ba9]">
                  Sign in to your account to continue.
                </p>

              </div>

              <form onSubmit={handleSubmit}>

                {/* Email */}
                <div className="mb-5">

                  <label
                    htmlFor="email"
                    className="mb-2 block text-[13px] font-semibold text-[#5f6070]"
                  >
                    Email address
                  </label>

                            <input
  id="email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="you@example.com"
  required
  className="h-12 w-full rounded-[10px] border border-[#e3e3eb] bg-[#fbfbfd] px-4 text-sm text-[#22222b] outline-none transition focus:border-[#6754e8] focus:bg-white focus:ring-4 focus:ring-[#6754e8]/10"
/>        

                </div>

                {/* Password */}
                <div className="mb-5">

                  <label
                    htmlFor="password"
                    className="mb-2 block text-[13px] font-semibold text-[#5f6070]"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <input
  id="password"
  type={showPassword ? "text" : "password"}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Enter your password"
  required
  className="h-12 w-full rounded-[10px] border border-[#e3e3eb] bg-[#fbfbfd] px-4 pr-16 text-sm text-[#22222b] outline-none transition focus:border-[#6754e8] focus:bg-white focus:ring-4 focus:ring-[#6754e8]/10"
/>
                    
                    
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6754e8]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>

                </div>

                {/* Remember + Forgot */}
                <div className="mb-6 flex items-center justify-between">

                  <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#777787]">

                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[#6754e8]"
                    />

                    Remember me

                  </label>

                  <button
                    type="button"
                    className="text-[13px] font-semibold text-[#6754e8]"
                  >
                    Forgot password?
                  </button>

                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-600">
                    {error}
                  </div>
                )}

                {/* Login button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-[10px] bg-gradient-to-r from-[#7763ed] to-[#5b47dc] text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition hover:-translate-y-[1px] hover:shadow-purple-500/35 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign in to dashboard"}
                </button>

              </form>

              {/* Register */}
              <div className="mt-6 text-center text-[13px] text-[#9b9ba9]">

                Don't have an account?

                <button
                  type="button"
                  className="ml-1 font-bold text-[#6754e8]"
                >
                  Start free trial
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

<div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-5 sm:p-8">

  {/* Login card */}
  <div className="grid w-full max-w-[1010px] overflow-hidden rounded-[28px] border border-white/15 shadow-[0_40px_100px_rgba(0,0,0,0.35)] lg:grid-cols-2">

    {/* LEFT SIDE */}
    {/* ...your existing left side... */}

    {/* RIGHT SIDE */}
    {/* ...your existing login side... */}

  </div>

  {/* Animated AI indicator */}
  <div className="relative mt-7 flex h-10 items-center justify-center">

    {/* Outer pulse */}
    <div className="absolute h-8 w-8 animate-ping rounded-full bg-purple-400/20" />

    {/* Middle glow */}
    <div className="absolute h-5 w-5 animate-pulse rounded-full bg-purple-400/30 blur-sm" />

    {/* Center */}
    <div className="relative flex h-3 w-3 items-center justify-center rounded-full bg-purple-300 shadow-[0_0_20px_rgba(167,139,250,0.9)]" />

  </div>

</div>
<div className="relative mt-6 flex flex-col items-center">

  <div className="relative flex h-8 w-8 items-center justify-center">

    <div className="absolute h-8 w-8 animate-ping rounded-full bg-purple-400/20" />

    <div className="absolute h-5 w-5 animate-pulse rounded-full bg-purple-400/30 blur-sm" />

    <div className="relative h-2.5 w-2.5 rounded-full bg-purple-300 shadow-[0_0_18px_rgba(196,181,253,0.9)]" />

  </div>

  <p className="mt-2 animate-pulse text-[11px] tracking-[0.2em] text-white/40">
    AI CASH FLOW INTELLIGENCE
  </p>

</div>
    </div>
    
  );
};