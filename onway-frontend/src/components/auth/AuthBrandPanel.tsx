import { Package, MapPin, Shield, TrendingUp, Truck, BarChart3 } from "lucide-react";

/**
 * Dark branded left panel shared by Login and Signup pages.
 * Pure presentation — no auth logic, no API calls.
 */
export function AuthBrandPanel() {
  return (
    <div className="auth-brand-panel relative hidden overflow-hidden md:flex md:flex-col md:justify-between">
      {/* Subtle background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-400/6 blur-3xl" />
        <div className="absolute right-12 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-emerald-600/5 blur-2xl" />
      </div>

      {/* Top: brand logo */}
      <div className="relative z-10 px-10 pt-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white shadow-lg shadow-emerald-500/25">
            O
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            Onway
          </span>
        </div>

        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE TRACKING
          </span>
        </div>
      </div>

      {/* Middle: hero messaging */}
      <div className="relative z-10 px-10">
        <h2 className="text-[2.5rem] font-bold leading-tight text-white">
          Your shipments,
          <br />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent italic">
            fully
          </span>
          <br />
          in control.
        </h2>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-400">
          Real-time tracking, smart status updates, and delivery management
          built for modern logistics teams.
        </p>

        {/* Stats row */}
        <div className="mt-8 flex gap-3">
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-sm">
            <p className="text-xl font-bold text-white">12.4K</p>
            <p className="mt-0.5 text-xs text-slate-500">Delivered</p>
          </div>
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-sm">
            <p className="text-xl font-bold text-white">99.8%</p>
            <p className="mt-0.5 text-xs text-slate-500">On-time</p>
          </div>
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-sm">
            <p className="text-xl font-bold text-white">4.9★</p>
            <p className="mt-0.5 text-xs text-slate-500">Rating</p>
          </div>
        </div>

        {/* Mini chart */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Delivery Performance · 7 Days
            </p>
            <span className="text-xs font-semibold text-emerald-400">
              ↑ +12.3%
            </span>
          </div>
          <div className="mt-3 flex items-end gap-1.5" aria-hidden="true">
            {[40, 55, 35, 65, 50, 75, 85].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400"
                  style={{ height: `${h}px` }}
                />
                <span className="text-[10px] text-slate-600">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: trust items */}
      <div className="relative z-10 px-10 pb-10">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            Secure Authentication
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
            Reliable Tracking
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-emerald-500" />
            Role-based Access
          </span>
        </div>
      </div>

      {/* Floating decorative icons */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Truck className="absolute right-8 top-24 h-8 w-8 text-white/[0.03] rotate-12" />
        <BarChart3 className="absolute left-6 bottom-32 h-7 w-7 text-white/[0.04] -rotate-12" />
        <TrendingUp className="absolute right-16 bottom-48 h-6 w-6 text-white/[0.03]" />
      </div>
    </div>
  );
}
