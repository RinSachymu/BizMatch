import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      toast.success("Welcome back!");
      nav("/discover");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8" data-testid="login-logo-link">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white grid place-items-center">
            <Building2 className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div className="font-heading font-extrabold text-xl tracking-tight text-slate-900">BizMatch</div>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200 p-8">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Log in to your deal room</h1>
          <p className="text-sm text-slate-500 mt-1.5">Enter your details to continue.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password-input"
                className="mt-1.5 h-11 rounded-lg"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-button"
              className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold"
            >
              {loading ? "Signing in…" : (<>Sign in <ArrowRight className="w-4 h-4 ml-1.5" /></>)}
            </Button>
          </form>

          <div className="mt-6 text-sm text-slate-600 text-center">
            New here?{" "}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline" data-testid="login-to-register-link">
              Create an account
            </Link>
          </div>
          <div className="mt-4 text-xs text-slate-400 text-center font-mono">
            Try demo: admin@bizmatch.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
