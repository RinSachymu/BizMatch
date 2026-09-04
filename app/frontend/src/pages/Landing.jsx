import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, TrendingUp, Handshake, Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" data-testid="landing-logo" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center">
              <Building2 className="w-5 h-5" strokeWidth={2.25} />
            </div>
            <div className="font-heading font-extrabold text-lg tracking-tight text-slate-900">BizMatch</div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" data-testid="landing-login-button" className="text-slate-700">Log in</Button>
            </Link>
            <Link to="/register">
              <Button data-testid="landing-signup-button" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold">
                Get started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-mono uppercase tracking-widest font-semibold text-blue-700">Deal flow, redesigned</span>
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-slate-900">
                Where founders meet the capital<br/>
                <span className="text-blue-600">that actually gets them.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
                BizMatch is the swipe-driven deal room for ambitious businesses and investors.
                Two-way opt-in. Warm intros from day one. No cold decks in strangers' inboxes.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/register">
                  <Button data-testid="hero-primary-cta" size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold px-6 shadow-md hover:shadow-lg transition-all">
                    Start matching
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button data-testid="hero-secondary-cta" size="lg" variant="outline" className="rounded-xl font-semibold border-slate-300 hover:bg-slate-100">
                    I have an account
                  </Button>
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
                {[
                  { k: "1,200+", v: "Vetted businesses" },
                  { k: "340", v: "Active funders" },
                  { k: "$180M", v: "Deals in pipeline" },
                ].map((s) => (
                  <div key={s.v}>
                    <div className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">{s.k}</div>
                    <div className="text-xs uppercase tracking-widest font-mono text-slate-500 font-semibold mt-1">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] max-w-sm mx-auto">
                <div className="absolute inset-x-6 top-6 bottom-0 rounded-3xl bg-slate-100 border border-slate-200 rotate-3 shadow-lg" />
                <div className="absolute inset-x-3 top-3 bottom-3 rounded-3xl bg-white border border-slate-200 -rotate-2 shadow-xl" />
                <div className="absolute inset-0 rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1617761141732-d481912af1a9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                    alt="Skyscraper"
                    className="w-full h-1/2 object-cover"
                  />
                  <div className="p-5">
                    <div className="text-xs uppercase tracking-widest font-mono text-blue-600 font-semibold">Series A · SaaS</div>
                    <div className="font-heading font-bold text-lg text-slate-900 mt-1">Northlight Ventures</div>
                    <div className="text-sm text-slate-600 mt-1">$3M–$12M · Europe B2B</div>
                    <div className="mt-4 flex gap-2">
                      <div className="h-9 flex-1 rounded-xl bg-red-50 border border-red-200 grid place-items-center text-red-500 text-sm font-semibold">Pass</div>
                      <div className="h-9 flex-1 rounded-xl bg-emerald-500 text-white grid place-items-center text-sm font-semibold shadow-md shadow-emerald-500/25">Match</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-widest font-mono text-blue-600 font-semibold">How it works</div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-2">
            Three steps between you and your next deal.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Building2, title: "Build your dossier", body: "Founders publish a data-room-lite; investors set their thesis. One profile, zero decks." },
            { icon: Zap, title: "Swipe the shortlist", body: "Our engine pre-filters by stage, ticket size and sector. You just say yes or next." },
            { icon: Handshake, title: "Chat on mutual match", body: "Only when both sides opt in. Encrypted DMs, calendar handoff, e-signature ready." },
          ].map((f) => (
            <div key={f.title} className="p-8 rounded-2xl border border-slate-200 bg-white hover:shadow-lg hover:border-slate-300 transition-all">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white grid place-items-center mb-5">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-slate-900">{f.title}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="rounded-3xl bg-slate-900 text-white p-10 lg:p-16 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
              Ship your next round faster. Zero cold intros.
            </h2>
            <p className="mt-4 text-slate-300 text-lg">
              Join 1,500+ operators and funders closing deals through mutual match.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register?role=business">
                <Button data-testid="cta-business-button" size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-semibold">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  I'm a business
                </Button>
              </Link>
              <Link to="/register?role=investor">
                <Button data-testid="cta-investor-button" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">
                  <Handshake className="w-4 h-4 mr-2" />
                  I'm an investor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-500">© 2026 BizMatch. All rights reserved.</div>
          <div className="text-xs font-mono uppercase tracking-widest text-slate-500 font-semibold">Built for operators</div>
        </div>
      </footer>
    </div>
  );
}
