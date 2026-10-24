import { useEffect, useRef, useState } from "react";
import { askCoordinator, SUGGESTED_QUESTIONS } from "../lib/aiCoordinator.js";
import { Icon } from "./ui.jsx";

const GREETING = {
  role: "ai",
  text: "Hi, I'm your AI Referral Coordinator. I can tell you which referrals need attention, explain what's blocking a patient, suggest the next administrative action, or draft messages. I don't provide medical advice.",
};

export default function AICoordinator({ open, onClose, pendingQuestion, onConsumed, patients }) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  function send(text) {
    const question = (text ?? input).trim();
    if (!question) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setTyping(true);
    // Simulate a short "thinking" delay for a natural feel.
    window.setTimeout(() => {
      const answer = askCoordinator(question, patients);
      setMessages((m) => [...m, { role: "ai", text: answer }]);
      setTyping(false);
    }, 550);
  }

  // When the panel is opened with a pre-filled question (from a patient page).
  useEffect(() => {
    if (open && pendingQuestion) {
      send(pendingQuestion);
      onConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pendingQuestion]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <>
      {/* Backdrop on mobile */}
      {open && <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden" />}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md transform flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <Icon.Spark className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold leading-tight">AI Referral Coordinator</div>
              <div className="text-xs text-brand-100">Administrative guidance · no medical advice</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-white/80 hover:bg-white/20 hover:text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="thin-scroll flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm bg-brand-500 text-white"
                    : "rounded-bl-sm bg-slate-100 text-slate-800"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
              </div>
            </div>
          )}
        </div>

        {/* Suggested questions */}
        <div className="border-t border-slate-100 px-4 pt-3">
          <div className="mb-2 text-xs font-medium text-slate-400">Try asking</div>
          <div className="flex flex-wrap gap-2 pb-3">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-slate-200 p-4"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a referral…"
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40"
            disabled={!input.trim()}
          >
            <Icon.Send className="h-5 w-5" />
          </button>
        </form>
      </aside>
    </>
  );
}

function Dot({ delay = "0ms" }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
      style={{ animationDelay: delay }}
    />
  );
}
