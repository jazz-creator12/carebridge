import { useEffect, useId, useRef, useState } from "react";
import { askCoordinator, getSuggestedQuestions } from "../lib/aiCoordinator.js";
import { Icon } from "./ui.jsx";

const GREETING = {
  role: "ai",
  text: "Hi, I'm your AI Referral Coordinator. I can tell you which referrals need attention, explain what's blocking a patient, suggest the next administrative action, or draft messages. I don't provide medical advice.",
};

// Render existing answer text as scannable paragraphs and lists (text itself is unchanged).
function MessageBody({ text }) {
  const blocks = [];
  let list = null;
  text.split("\n").forEach((line, i) => {
    const bullet = line.match(/^•\s+(.*)/);
    const numbered = line.match(/^(\d+)\.\s+(.*)/);
    if (bullet || numbered) {
      const type = bullet ? "ul" : "ol";
      if (!list || list.type !== type) {
        list = { type, items: [], key: `l${i}` };
        blocks.push(list);
      }
      list.items.push(bullet ? bullet[1] : numbered[2]);
    } else {
      list = null;
      if (line.trim() === "") return;
      blocks.push({ type: "p", text: line, key: `p${i}` });
    }
  });
  return (
    <div className="space-y-2">
      {blocks.map((b) =>
        b.type === "p" ? (
          <p key={b.key}>{b.text}</p>
        ) : b.type === "ul" ? (
          <ul key={b.key} className="list-disc space-y-1 pl-5">
            {b.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        ) : (
          <ol key={b.key} className="list-decimal space-y-1 pl-5">
            {b.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ol>
        )
      )}
    </div>
  );
}

export default function AICoordinator({ open, onClose, pendingQuestion, onConsumed, patients }) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const returnFocusRef = useRef(null);
  const inputId = useId();

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

  // Focus management: move focus in when opened, restore it to the opener when closed.
  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement;
      inputRef.current?.focus();
    } else if (returnFocusRef.current) {
      returnFocusRef.current.focus?.();
      returnFocusRef.current = null;
    }
  }, [open]);

  return (
    <>
      {/* Backdrop on small screens, where the panel covers the page */}
      {open && <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" />}

      <aside
        id="ai-coordinator-panel"
        aria-label="AI Referral Coordinator"
        aria-hidden={!open}
        // A closed panel must not be reachable by keyboard or screen reader.
        {...(!open ? { inert: "" } : {})}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        // Opening: visibility flips instantly (so focus() works on the first frame).
        // Closing: visibility waits for the slide-out to finish, then hides the panel.
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl duration-300 ${
          open
            ? "visible translate-x-0 transition-transform"
            : "invisible translate-x-full transition-[transform,visibility]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon.Spark className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">AI Referral Coordinator</h2>
              <p className="text-xs text-slate-600">Rule-based · reads live referral state · no medical advice</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close AI Coordinator" className="btn btn-ghost h-10 w-10 !min-h-0 !p-0">
            <Icon.Close className="h-5 w-5" />
          </button>
        </div>

        {/* Conversation (announced politely as new messages arrive) */}
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversation"
          tabIndex={0}
          className="thin-scroll flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm bg-brand-600 text-white"
                    : "rounded-bl-sm border border-slate-200 bg-white text-slate-800 shadow-card"
                }`}
              >
                <span className="sr-only">{m.role === "user" ? "You: " : "Coordinator: "}</span>
                <MessageBody text={m.text} />
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start" role="status">
              <span className="sr-only">CareBridge is preparing an answer</span>
              <div aria-hidden="true" className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
                <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
              </div>
            </div>
          )}
        </div>

        {/* Suggested questions */}
        <div className="border-t border-slate-200 px-4 pt-3">
          <h3 className="label-caps mb-2">Suggested questions</h3>
          <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto pb-3">
            {getSuggestedQuestions(patients).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="min-h-[36px] rounded-full border border-slate-300 bg-white px-3 py-1 text-left text-sm text-slate-800 transition-colors hover:border-brand-400 hover:bg-brand-50"
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
          className="border-t border-slate-200 p-4"
        >
          <label htmlFor={inputId} className="sr-only">
            Ask the coordinator a question about a referral
          </label>
          <div className="flex items-center gap-2">
            <input
              id={inputId}
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a referral…"
              autoComplete="off"
              className="min-h-[44px] flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-500"
            />
            <button
              type="submit"
              aria-label="Send question"
              className="btn btn-primary h-11 w-11 !min-h-0 !p-0"
              disabled={!input.trim()}
            >
              <Icon.Send className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Answers come from CareBridge&apos;s rules and the live demo state, not a language model.
          </p>
        </form>
      </aside>
    </>
  );
}

function Dot({ delay = "0ms" }) {
  return (
    <span
      className="h-2 w-2 rounded-full bg-slate-500 motion-safe:animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}
