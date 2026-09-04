import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError, fileUrl } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Check } from "lucide-react";

const INDUSTRIES = ["SaaS", "Fintech", "AI", "Manufacturing", "Logistics", "Retail",
  "Consumer Goods", "Biotech", "Robotics", "AgriTech", "Cybersecurity", "Real Estate", "Health"];

export default function Profile({ isOnboarding = false }) {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) setForm({
      display_name: user.display_name || "",
      tagline: user.tagline || "",
      description: user.description || "",
      industry: user.industry || "",
      location: user.location || "",
      website: user.website || "",
      logo_path: user.logo_path || null,
      // business
      company_size: user.company_size || "",
      stage: user.stage || "",
      funding_needed: user.funding_needed || "",
      revenue: user.revenue || "",
      looking_for: (user.looking_for || []).join(", "),
      // investor
      firm_type: user.firm_type || "",
      ticket_size: user.ticket_size || "",
      focus_industries: (user.focus_industries || []).join(", "),
      portfolio_count: user.portfolio_count || 0,
    });
  }, [user]);

  if (!form) {
    return <div className="p-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isBusiness = user.role === "business";

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      display_name: form.display_name,
      tagline: form.tagline,
      description: form.description,
      industry: form.industry,
      location: form.location,
      website: form.website,
      logo_path: form.logo_path,
    };
    if (isBusiness) {
      payload.company_size = form.company_size;
      payload.stage = form.stage;
      payload.funding_needed = form.funding_needed;
      payload.revenue = form.revenue;
      payload.looking_for = form.looking_for.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      payload.firm_type = form.firm_type;
      payload.ticket_size = form.ticket_size;
      payload.focus_industries = form.focus_industries.split(",").map((s) => s.trim()).filter(Boolean);
      payload.portfolio_count = Number(form.portfolio_count) || 0;
    }
    try {
      await api.put("/profile", payload);
      await refresh();
      toast.success(isOnboarding ? "Profile complete! Let's start matching." : "Profile updated");
      if (isOnboarding) window.location.href = "/discover";
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, logo_path: data.path }));
      toast.success("Logo uploaded");
    } catch (e) { toast.error(formatApiError(e)); }
    finally { setUploading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest font-mono text-blue-600 font-semibold">
          {isOnboarding ? "Onboarding" : "Profile"}
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          {isOnboarding ? "Complete your dossier" : (isBusiness ? "Your business profile" : "Your investor profile")}
        </h1>
        <p className="text-slate-600 mt-2 text-sm">The stronger your profile, the better your matches.</p>
      </div>

      <form onSubmit={onSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Logo */}
        <div>
          <Label className="text-slate-700 font-medium">Logo</Label>
          <div className="mt-2 flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden grid place-items-center border border-slate-200">
              {form.logo_path ? (
                <img src={fileUrl(form.logo_path)} alt="" className="w-full h-full object-cover" />
              ) : user.logo_url ? (
                <img src={user.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading font-bold text-slate-400 text-2xl">
                  {form.display_name?.[0] || "?"}
                </span>
              )}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer text-sm font-semibold text-slate-700">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Uploading…" : "Upload logo"}
              <input type="file" className="hidden" accept="image/*" onChange={onUpload} data-testid="profile-logo-upload" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label className="text-slate-700 font-medium">{isBusiness ? "Company name" : "Firm name"}</Label>
            <Input required value={form.display_name} onChange={set("display_name")} data-testid="profile-display-name-input" className="mt-1.5 h-11 rounded-lg" />
          </div>
          <div>
            <Label className="text-slate-700 font-medium">Industry</Label>
            <Input list="industries" required value={form.industry} onChange={set("industry")} data-testid="profile-industry-input" className="mt-1.5 h-11 rounded-lg" placeholder="e.g. SaaS" />
            <datalist id="industries">
              {INDUSTRIES.map((i) => <option key={i} value={i} />)}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-slate-700 font-medium">Tagline</Label>
            <Input value={form.tagline} onChange={set("tagline")} data-testid="profile-tagline-input" className="mt-1.5 h-11 rounded-lg" placeholder="A one-line pitch" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-slate-700 font-medium">Description</Label>
            <Textarea required value={form.description} onChange={set("description")} data-testid="profile-description-input" className="mt-1.5 rounded-lg min-h-[100px]" placeholder="What you do and why it matters" />
          </div>
          <div>
            <Label className="text-slate-700 font-medium">Location</Label>
            <Input value={form.location} onChange={set("location")} data-testid="profile-location-input" className="mt-1.5 h-11 rounded-lg" placeholder="City, Country" />
          </div>
          <div>
            <Label className="text-slate-700 font-medium">Website</Label>
            <Input value={form.website} onChange={set("website")} data-testid="profile-website-input" className="mt-1.5 h-11 rounded-lg" placeholder="https://…" />
          </div>

          {isBusiness ? (
            <>
              <div>
                <Label className="text-slate-700 font-medium">Stage</Label>
                <Input value={form.stage} onChange={set("stage")} data-testid="profile-stage-input" className="mt-1.5 h-11 rounded-lg" placeholder="Seed, Series A…" />
              </div>
              <div>
                <Label className="text-slate-700 font-medium">Team size</Label>
                <Input value={form.company_size} onChange={set("company_size")} data-testid="profile-company-size-input" className="mt-1.5 h-11 rounded-lg" placeholder="e.g. 10-25" />
              </div>
              <div>
                <Label className="text-slate-700 font-medium">Revenue</Label>
                <Input value={form.revenue} onChange={set("revenue")} data-testid="profile-revenue-input" className="mt-1.5 h-11 rounded-lg" placeholder="$500K ARR" />
              </div>
              <div>
                <Label className="text-slate-700 font-medium">Funding needed</Label>
                <Input value={form.funding_needed} onChange={set("funding_needed")} data-testid="profile-funding-needed-input" className="mt-1.5 h-11 rounded-lg" placeholder="$3M" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-slate-700 font-medium">Looking for (comma-separated tags)</Label>
                <Input value={form.looking_for} onChange={set("looking_for")} data-testid="profile-looking-for-input" className="mt-1.5 h-11 rounded-lg" placeholder="Growth capital, Warehouse partners" />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-slate-700 font-medium">Firm type</Label>
                <Input value={form.firm_type} onChange={set("firm_type")} data-testid="profile-firm-type-input" className="mt-1.5 h-11 rounded-lg" placeholder="VC, PE, Angel…" />
              </div>
              <div>
                <Label className="text-slate-700 font-medium">Ticket size</Label>
                <Input value={form.ticket_size} onChange={set("ticket_size")} data-testid="profile-ticket-size-input" className="mt-1.5 h-11 rounded-lg" placeholder="$500K - $5M" />
              </div>
              <div>
                <Label className="text-slate-700 font-medium">Portfolio count</Label>
                <Input type="number" min={0} value={form.portfolio_count} onChange={set("portfolio_count")} data-testid="profile-portfolio-count-input" className="mt-1.5 h-11 rounded-lg" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-slate-700 font-medium">Focus industries (comma-separated)</Label>
                <Input value={form.focus_industries} onChange={set("focus_industries")} data-testid="profile-focus-industries-input" className="mt-1.5 h-11 rounded-lg" placeholder="SaaS, Fintech, AI" />
              </div>
            </>
          )}
        </div>

        <Button
          type="submit"
          disabled={saving}
          data-testid="profile-save-button"
          className="h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {isOnboarding ? "Finish onboarding" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
