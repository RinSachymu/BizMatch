import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, formatApiError, fileUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { X, Heart, Loader2, MapPin, Briefcase, TrendingUp, DollarSign, Users, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function SwipeCard({ candidate, onSwipe, isTop, index }) {
  const [exitDirection, setExitDirection] = useState(0);
  const dragX = useRef(0);
  const isBusiness = candidate.role === "business";

  return (
    <motion.div
      className="absolute inset-0 swipe-card"
      style={{ zIndex: 10 - index }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDrag={(_, info) => { dragX.current = info.offset.x; }}
      onDragEnd={(_, info) => {
        const threshold = 120;
        if (info.offset.x > threshold) { setExitDirection(1); onSwipe("like"); }
        else if (info.offset.x < -threshold) { setExitDirection(-1); onSwipe("pass"); }
      }}
      animate={
        exitDirection !== 0
          ? { x: exitDirection * 600, opacity: 0, rotate: exitDirection * 18 }
          : { scale: 1 - index * 0.04, y: index * -14, opacity: index > 2 ? 0 : 1 - index * 0.12 }
      }
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      whileDrag={{ rotate: 0 }}
    >
      <div className="w-full h-full rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden flex flex-col">
        <div className="relative h-56 sm:h-64 bg-slate-100">
          {(candidate.logo_url || candidate.logo_path) && (
            <img
              src={candidate.logo_url || fileUrl(candidate.logo_path)}
              alt={candidate.display_name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 backdrop-blur border border-slate-200 text-slate-700">
            <Sparkles className="w-3 h-3 text-blue-600" />
            {isBusiness ? "Business" : "Investor"}
          </div>
          {candidate.stage && (
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/85 backdrop-blur text-white">
              {candidate.stage}
            </div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="text-xs uppercase tracking-widest font-mono text-blue-600 font-semibold">
            {candidate.industry || "Company"}
          </div>
          <h3 className="font-heading text-2xl font-bold text-slate-900 mt-1 leading-tight">
            {candidate.display_name}
          </h3>
          {candidate.tagline && (
            <p className="text-slate-600 mt-1.5 text-sm leading-relaxed">{candidate.tagline}</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            {candidate.location && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{candidate.location}</span>
              </div>
            )}
            {isBusiness && candidate.revenue && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="truncate">{candidate.revenue}</span>
              </div>
            )}
            {isBusiness && candidate.funding_needed && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate">{candidate.funding_needed}</span>
              </div>
            )}
            {isBusiness && candidate.company_size && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{candidate.company_size} team</span>
              </div>
            )}
            {!isBusiness && candidate.ticket_size && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate">{candidate.ticket_size}</span>
              </div>
            )}
            {!isBusiness && candidate.firm_type && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{candidate.firm_type}</span>
              </div>
            )}
            {!isBusiness && candidate.portfolio_count > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{candidate.portfolio_count} portfolio</span>
              </div>
            )}
          </div>

          {candidate.description && (
            <p className="mt-4 text-sm text-slate-600 leading-relaxed line-clamp-3">
              {candidate.description}
            </p>
          )}

          {((isBusiness && candidate.looking_for?.length > 0) ||
            (!isBusiness && candidate.focus_industries?.length > 0)) && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(isBusiness ? candidate.looking_for : candidate.focus_industries).map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MatchModal({ open, other, onClose, onChat }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="match-modal"
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono uppercase tracking-widest font-semibold text-emerald-700">
              <Sparkles className="w-3 h-3" />
              It's a match
            </div>
            <h2 className="font-heading text-3xl font-extrabold text-slate-900 mt-4 tracking-tight">
              You matched with<br /> {other?.display_name}
            </h2>
            <p className="text-slate-600 mt-3">
              Both of you swiped right. Time to start the conversation.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={onClose} data-testid="match-modal-close-button" className="flex-1 h-11 rounded-lg font-semibold">
                Keep swiping
              </Button>
              <Button onClick={onChat} data-testid="match-modal-chat-button" className="flex-1 h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                Say hi
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Discover() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);

  useEffect(() => {
    if (!user?.profile_complete) return;
    (async () => {
      try {
        const { data } = await api.get("/discover");
        setCandidates(data);
      } catch (e) {
        toast.error(formatApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (user && !user.profile_complete) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="font-heading text-2xl font-bold text-slate-900">Complete your profile first</h2>
        <p className="text-slate-600 mt-2">You need a complete profile before you can start discovering matches.</p>
        <Button className="mt-6 rounded-lg bg-slate-900 hover:bg-slate-800" onClick={() => nav("/onboarding")} data-testid="incomplete-profile-cta">
          Finish onboarding
        </Button>
      </div>
    );
  }

  const handleSwipe = async (direction) => {
    if (candidates.length === 0) return;
    const top = candidates[0];
    setCandidates((c) => c.slice(1));
    try {
      const { data } = await api.post("/swipe", { target_id: top.id, direction });
      if (data.matched) {
        setMatch({ match_id: data.match_id, other: data.target });
      }
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-widest font-mono text-blue-600 font-semibold">Discover</div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          {user?.role === "business" ? "Investors curated for you" : "Businesses raising now"}
        </h1>
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-[3/4]" data-testid="swipe-card-stack">
        {loading ? (
          <div className="absolute inset-0 grid place-items-center rounded-3xl border border-dashed border-slate-300 bg-white">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center rounded-3xl border border-dashed border-slate-300 bg-white text-center p-8">
            <div>
              <div className="text-6xl mb-3">🎯</div>
              <div className="font-heading font-bold text-lg text-slate-900">You're all caught up</div>
              <div className="text-sm text-slate-500 mt-1">Check back soon for new matches.</div>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {candidates.slice(0, 3).map((c, idx) => (
              <SwipeCard
                key={c.id}
                candidate={c}
                index={idx}
                isTop={idx === 0}
                onSwipe={handleSwipe}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => handleSwipe("pass")}
          disabled={loading || candidates.length === 0}
          data-testid="swipe-pass-button"
          className="w-14 h-14 rounded-full border-2 border-red-200 bg-white text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 grid place-items-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X className="w-7 h-7" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => handleSwipe("like")}
          disabled={loading || candidates.length === 0}
          data-testid="swipe-match-button"
          className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200 grid place-items-center shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Heart className="w-7 h-7 fill-current" strokeWidth={2} />
        </button>
      </div>
      <p className="mt-4 text-center text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold">
        Drag or tap · Left to pass · Right to match
      </p>

      <MatchModal
        open={!!match}
        other={match?.other}
        onClose={() => setMatch(null)}
        onChat={() => { const m = match; setMatch(null); nav(`/matches/${m.match_id}`); }}
      />
    </div>
  );
}
