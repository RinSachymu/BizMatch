import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiError, fileUrl } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, MessageSquareText, ArrowRight } from "lucide-react";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/matches");
        setMatches(data);
      } catch (e) { toast.error(formatApiError(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest font-mono text-blue-600 font-semibold">Matches</div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          Your conversations
        </h1>
        <p className="text-slate-600 mt-2 text-sm">Mutual matches only. Both sides opted in.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" data-testid="matches-list-container">
        {loading ? (
          <div className="p-10 grid place-items-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : matches.length === 0 ? (
          <div className="p-10 text-center">
            <MessageSquareText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <div className="font-heading font-bold text-lg text-slate-900">No matches yet</div>
            <div className="text-sm text-slate-500 mt-1">Head to Discover and start swiping.</div>
            <Link
              to="/discover"
              data-testid="matches-to-discover-link"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              Go to Discover
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {matches.map((m) => (
              <li key={m.match_id}>
                <Link
                  to={`/matches/${m.match_id}`}
                  data-testid={`match-item-${m.match_id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 grid place-items-center">
                    {(m.other_user.logo_url || m.other_user.logo_path) ? (
                      <img
                        src={m.other_user.logo_url || fileUrl(m.other_user.logo_path)}
                        alt={m.other_user.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-heading font-bold text-slate-500">
                        {m.other_user.display_name?.[0] || "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-heading font-semibold text-slate-900 truncate">
                        {m.other_user.display_name}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-mono font-semibold text-slate-500">
                        {m.other_user.role}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {m.last_message || m.other_user.tagline || "Start the conversation"}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
