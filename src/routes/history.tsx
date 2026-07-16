import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  formatRs,
  sp,
  useSP,
  type Category,
  type Expense,
} from "@/lib/smartpocket-store";
import { BottomNav, SPShell } from "@/components/sp-shell";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Expense History — SmartPocket" },
      { name: "description", content: "Browse this week's and this month's expenses by category." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const state = useSP();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!state.user) navigate({ to: "/login" });
  }, [state.user, navigate]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return state.expenses;
    return state.expenses.filter(
      (e) => e.name.toLowerCase().includes(needle) || e.category.toLowerCase().includes(needle),
    );
  }, [state.expenses, q]);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeek = filtered.filter((e) => new Date(e.date) >= startOfWeek);
  const thisMonth = filtered.filter((e) => new Date(e.date) >= startOfMonth);

  const weekTotals = totalsByCategory(thisWeek);
  const monthTotals = totalsByCategory(thisMonth);

  return (
    <SPShell>
      <h1 className="mb-4 text-center text-3xl font-extrabold text-primary">Expense History</h1>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/70" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Expenses"
          className="w-full rounded-full border-2 border-primary/60 bg-card py-3 pl-14 pr-5 text-base font-medium text-foreground outline-none placeholder:text-primary/60 focus:border-primary"
        />
      </div>

      <Section title="This Week:" totals={weekTotals} />
      <Section title="This Month:" totals={monthTotals} />

      {filtered.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-extrabold text-foreground">Recent</h2>
          <ul className="flex flex-col gap-2">
            {filtered.slice(0, 20).map((e) => (
              <RecentRow key={e.id} expense={e} />
            ))}
          </ul>
        </section>
      )}

      <BottomNav />
    </SPShell>
  );
}

function totalsByCategory(items: Expense[]) {
  const map = new Map<Category, number>();
  for (const e of items) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return CATEGORIES.map((c) => ({ category: c, amount: map.get(c) ?? 0 })).filter(
    (x) => x.amount > 0,
  );
}

function Section({
  title,
  totals,
}: {
  title: string;
  totals: { category: Category; amount: number }[];
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-2xl font-extrabold text-foreground">{title}</h2>
      {totals.length === 0 ? (
        <p className="pl-2 text-sm font-semibold text-muted-foreground">No expenses in this range.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {totals.map((t) => (
            <li
              key={t.category}
              className="flex items-center justify-between rounded-2xl bg-card px-5 py-3 shadow-sm"
            >
              <span className="text-base font-bold text-foreground">
                {t.category} {CATEGORY_EMOJI[t.category]}
              </span>
              <span className="text-base font-semibold text-foreground/80">
                {formatRs(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentRow({ expense }: { expense: Expense }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">
          {CATEGORY_EMOJI[expense.category]} {expense.name}
        </p>
        <p className="text-xs font-semibold text-muted-foreground">
          {expense.category} · {new Date(expense.date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-bold text-foreground">{formatRs(expense.amount)}</span>
        <button
          onClick={() => sp.removeExpense(expense.id)}
          className="grid h-8 w-8 place-items-center rounded-full text-destructive transition hover:bg-destructive/10"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
