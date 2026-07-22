import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { MessageCircle, Send, X } from "lucide-react";
import { formatRs, totalSpent, byCategory, useSP } from "@/lib/smartpocket-store";

type Msg = { from: "user" | "bot"; text: string };

const QUICK_QUESTIONS = [
  "How is my budget calculated?",
  "How much have I spent?",
  "How do I add an expense?",
  "How do I change my budget?",
];

export function HelpAgent() {
  const state = useSP();
  const pathname = useRouterState({ select: (s) => s.location.pathname }); // NEW
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: "Hi! 👋 I'm your SmartPocket helper. Ask me anything about the app or your spending." },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  // NEW — hide on the login screen (and whenever no user is signed in)
  if (pathname === "/login" || !state.user) return null;

  function answer(q: string): string {
    const t = q.toLowerCase();
    const b = state.budget;
    const budget = b ? b.allowance + b.income - b.savingsGoal : 0;
    const spent = totalSpent(state.expenses);
    const remaining = Math.max(budget - spent, 0);

    if (/(budget).*(calculat|work|formula|how)|how.*(budget)/.test(t) && /calculat|formula|work|made|computed/.test(t))
      return b
        ? `Your budget = allowance + income − savings goal. That's ${formatRs(b.allowance)} + ${formatRs(b.income)} − ${formatRs(b.savingsGoal)} = ${formatRs(budget)}.`
        : "Your budget = allowance + income − savings goal. Set these up on the Set Budget page.";

    if (/remaining|balance|left/.test(t))
      return b
        ? `Your remaining balance is ${formatRs(remaining)}. It's your budget (${formatRs(budget)}) minus everything you've spent (${formatRs(spent)}).`
        : "Remaining balance = your budget minus your expenses. Set up a budget first on the Set Budget page.";

    if (/spent|spending|expense.*total|total.*expense|how much/.test(t)) {
      if (state.expenses.length === 0) return "You haven't added any expenses yet. Tap 'Add' in the bottom bar to log your first one!";
      const top = byCategory(state.expenses).sort((a, c) => c.amount - a.amount)[0];
      return `You've spent ${formatRs(spent)} in total. Your biggest category is ${top.category} at ${formatRs(top.amount)}.`;
    }

    if (/add.*(expense|spending)|log|record|new expense/.test(t))
      return "Tap 'Add' in the bottom bar (or 'Add Expense' in the menu ☰), fill in the name, amount, category and date, then hit Save Expense.";

    if (/delete|remove|undo/.test(t))
      return "Go to the History page from the bottom bar or menu — you can remove an expense from there.";

    if (/change|edit|update|set.*budget|allowance|income|saving/.test(t))
      return "Open the menu ☰ and tap 'Set Budget' (or the Set Budget button on Home). You can update your allowance, income and savings goal anytime.";

    if (/photo|picture|avatar|profile/.test(t))
      return "On the Home page, tap the round profile icon in the top-right corner, then choose 'Add photo'.";

    if (/logout|log out|sign out/.test(t))
      return "Tap the round profile icon on the Home page, then choose 'Logout'.";

    if (/reset|start over|clear|erase/.test(t))
      return "Your data is stored on this device. To start fresh, log out and clear this site's data in your browser settings — or just update your budget and remove old expenses from History.";

    if (/weekly|monthly|type/.test(t))
      return "On the Set Budget page you can choose a Weekly or Monthly budget type. It changes the label shown on your dashboard.";

    if (/breakdown|chart|pie|category/.test(t))
      return "The Breakdown page (bottom bar or menu ☰) shows a chart of your spending by category, plus your highest and lowest expense categories.";

    if (/history/.test(t))
      return "The History page lists all your logged expenses, most recent first.";

    if (/save.*smart|tip|advice|how.*save/.test(t))
      return `A good rule of thumb: keep your savings goal at 10–20% of what you receive. ${b ? `Right now you're setting aside ${formatRs(b.savingsGoal)} — nice!` : ""} Checking your Breakdown page weekly helps you spot where the money goes.`;

    if (/hi|hello|hey|salam|assalam/.test(t))
      return "Hello! 👋 Ask me anything about SmartPocket — budgets, expenses, or how any page works.";

    if (/thank|great|good|nice|ok/.test(t))
      return "You're welcome! Anything else you'd like to know? 😊";

    return "I can help with questions about SmartPocket — like how your budget is calculated, how much you've spent, or how to use any page. Try one of the suggestions below!";
  }

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { from: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: answer(q) }]);
      setTyping(false);
    }, 600);
  }

  return (
    <>
      {/* floating bubble — raised above iOS Safari's bottom bar */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
          className="fixed right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 transition active:scale-95"
          aria-label="Open help chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* chat panel */}
      {open && (
        <div
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
          className="fixed right-4 z-50 flex h-[420px] w-[320px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between bg-primary px-4 py-3">
            <span className="font-bold text-primary-foreground">SmartPocket Helper 🤖</span>
            <button
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-primary-foreground transition hover:bg-primary-foreground/20"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div key={i} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm font-medium " +
                    (m.from === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground")
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">typing…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-primary/40 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-border px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask a question…"
              className="flex-1 rounded-full border border-primary/40 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={() => send(input)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition active:scale-95"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}