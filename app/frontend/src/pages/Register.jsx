import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, TrendingUp, Handshake, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") === "investor" ? "investor" : "business");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await register({ email, password, role, display_name: displayName });
    setLoading(false);
    if (res.ok) {
      toast.success("Account created — let's complete your profile.");
      nav("/onboarding");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8" data-testid="register-logo-link">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white grid place-items-center">
            <Building2 className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div className="font-heading font-extrabold text-xl tracking-tight text-slate-900">BizMatch</div>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200 p-8">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1.5">Pick your side of the table.</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              data-testid="register-role-business-button"
              onClick={() => setRole("business")}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                role === "business"
                  ? "border-slate-900 bg-slate-900 text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              )}
            >
              <TrendingUp className={cn("w-5 h-5 mb-2", role === "business" ? "text-emerald-400" : "text-slate-500")} />
              <div className="font-heading font-semibold">Business</div>
              <div className={cn("text-xs mt-0.5", role === "business" ? "text-slate-300" : "text-slate-500")}>
                Seeking funding or partners
              </div>
            </button>
            <button
              type="button"
              data-testid="register-role-investor-button"
              onClick={() => setRole("investor")}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                role === "investor"
                  ? "border-slate-900 bg-slate-900 text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              )}
            >
              <Handshake className={cn("w-5 h-5 mb-2", role === "investor" ? "text-blue-400" : "text-slate-500")} />
              <div className="font-heading font-semibold">Investor</div>
              <div className={cn("text-xs mt-0.5", role === "investor" ? "text-slate-300" : "text-slate-500")}>
                Deploying capital
              </div>
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="displayName" className="text-slate-700 font-medium">
                {role === "business" ? "Company name" : "Firm name"}
              </Label>
              <Input
                id="displayName"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                data-testid="register-display-name-input"
                className="mt-1.5 h-11 rounded-lg"
                placeholder={role === "business" ? "Nova Logistics" : "Northlight Ventures"}
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-700 font-medium">Work email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="register-email-input"
                className="mt-1.5 h-11 rounded-lg"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="register-password-input"
                className="mt-1.5 h-11 rounded-lg"
                placeholder="At least 6 characters"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-button"
              className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold"
            >
              {loading ? "Creating…" : (<>Create account <ArrowRight className="w-4 h-4 ml-1.5" /></>)}
            </Button>
          </form>

          <div className="mt-6 text-sm text-slate-600 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline" data-testid="register-to-login-link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
