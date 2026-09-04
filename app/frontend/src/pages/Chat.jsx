import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, formatApiError, fileUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [messages, setMessages] = useState([]);
  const [other, setOther] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        const [msgs, matches] = await Promise.all([
          api.get(`/matches/${matchId}/messages`),
          api.get("/matches"),
        ]);
        if (cancel) return;
        setMessages(msgs.data);
        const found = matches.data.find((m) => m.match_id === matchId);
        setOther(found?.other_user || null);
      } catch (e) {
        if (!cancel) toast.error(formatApiError(e));
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/matches/${matchId}/messages`);
        if (!cancel) setMessages(data);
      } catch { /* ignore */ }
    }, 4000);

    return () => { cancel = true; clearInterval(pollRef.current); };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/matches/${matchId}/messages`, { text: text.trim() });
      setMessages((m) => [...m, data]);
      setText("");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-9rem)] md:h-[calc(100vh-5rem)] flex flex-col bg-white md:my-6 md:mx-4 md:rounded-2xl md:border md:border-slate-200 md:shadow-xl overflow-hidden">
      <div className="h-16 border-b border-slate-200 flex items-center gap-3 px-4 flex-shrink-0">
        <button onClick={() => nav("/matches")} data-testid="chat-back-button" className="p-2 -ml-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 grid place-items-center">
          {other && (other.logo_url || other.logo_path) ? (
            <img src={other.logo_url || fileUrl(other.logo_path)} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-heading font-bold text-slate-500">
              {other?.display_name?.[0] || "?"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {other ? (
            <Link to={`/user/${other.id}`} className="block" data-testid="chat-other-header-link">
              <div className="font-heading font-semibold text-slate-900 truncate">{other.display_name}</div>
              <div className="text-xs uppercase tracking-widest font-mono text-slate-500 font-semibold">
                {other.role}
              </div>
            </Link>
          ) : <div className="text-slate-400">Loading…</div>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50" data-testid="chat-messages-container">
        {loading ? (
          <div className="h-full grid place-items-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full grid place-items-center">
            <div className="text-center max-w-sm">
              <div className="text-4xl mb-2">👋</div>
              <div className="font-heading font-bold text-slate-900">Say hi to {other?.display_name}</div>
              <div className="text-sm text-slate-500 mt-1">Break the ice with a short intro or a specific ask.</div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {messages.map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"} data-testid={`chat-message-${m.id}`}>
                  <div className={
                    mine
                      ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] shadow-sm text-sm leading-relaxed"
                      : "bg-white border border-slate-200 text-slate-900 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%] shadow-sm text-sm leading-relaxed"
                  }>
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={send} className="border-t border-slate-200 p-3 flex items-center gap-2 flex-shrink-0 bg-white">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          data-testid="chat-message-input"
          className="flex-1 h-11 rounded-xl"
        />
        <Button
          type="submit"
          disabled={sending || !text.trim()}
          data-testid="chat-send-button"
          className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
