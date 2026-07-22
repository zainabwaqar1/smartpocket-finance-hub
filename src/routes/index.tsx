import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  budgetAmount,
  byCategory,
  CATEGORY_EMOJI,
  expensesInPeriod,
  formatRs,
  sp,
  totalSpent,
  useSP,
} from "@/lib/smartpocket-store";
import { BottomNav, SPShell } from "@/components/sp-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartPocket — Track your spending. Save smarter." },
      {
        name: "description",
        content:
          "SmartPocket is a mobile-first personal finance app to track spending, set budgets and hit your savings goals.",
      },
      { property: "og:title", content: "SmartPocket — Track your spending. Save smarter." },
      {
        property: "og:description",
        content: "Set a budget, log expenses and see where your money goes with SmartPocket.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const state = useSP();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.loading) return;
    if (!state.user) navigate({ to: "/login" });
    else if (!state.budget) navigate({ to: "/setup" });
  }, [state.loading, state.user, state.budget, navigate]);

  if (state.loading) {
    return (
      <SPShell>
        <div className="grid min-h-[60vh] place-items-center">
          <p className="text-sm font-semibold text-muted-foreground">Loading…</p>
        </div>
      </SPShell>
    );
  }

  if (!state.user || !state.budget) return null;

  // spending is scoped to the current budget period (month or week)
  const periodExpenses = expensesInPeriod(state.expenses, state.budget.type);
  const budget = budgetAmount(state.budget);
  const spent = totalSpent(periodExpenses);
  const remaining = budget - spent; // can go negative — shown honestly below
  const over = remaining < 0;
  const top = byCategory(periodExpenses)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <SPShell
      title={`Hello${state.user.firstName ? ` ${state.user.firstName}` : ""} 👋`}
      showProfile
      onProfile={() => { sp.logout(); navigate({ to: "/login" }); }}
    >
      {/* turns red and says "over budget" when overspent */}
      <div
        className={
          "mx-auto mb-5 rounded-full px-8 py-7 text-center shadow-xl " +
          (over ? "bg-destructive shadow-destructive/30" : "bg-primary shadow-primary/30")
        }
      >
        <p className="text-base font-semibold text-primary-foreground/90">
          {over ? "Over Budget" : "Remaining Balance"}
        </p>
        <p className="mt-1 text-3xl font-extrabold text-primary-foreground">
          {over ? formatRs(-remaining) : formatRs(remaining)}
        </p>
      </div>

      <div className="mx-auto mb-8 rounded-full bg-muted px-8 py-7 text-center">
        <p className="text-base font-semibold text-primary/90">{state.budget.type} Budget</p>
        <p className="mt-1 text-3xl font-extrabold text-primary">{formatRs(budget)}</p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-extrabold text-foreground">Top Spending:</h2>
        <ul className="mt-3 flex flex-col items-center gap-3 text-lg font-semibold">
          {top.length === 0 && (
            <li className="text-muted-foreground">
              No expenses this {state.budget.type === "Weekly" ? "week" : "month"} — add one below.
            </li>
          )}
          {top.map((t) => (
            <li key={t.category} className="text-foreground/80">
              {t.category} {CATEGORY_EMOJI[t.category]}: <span className="font-bold">{formatRs(t.amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex gap-3">
          <Link
            to="/add-expense"
            className="flex-1 rounded-full bg-primary px-4 py-4 text-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
          >
            + Add Expense
          </Link>
          <Link
            to="/setup"
            className="flex-1 rounded-full border-2 border-primary bg-card px-4 py-4 text-center text-sm font-bold text-primary"
          >
            Set Budget
          </Link>
        </div>
        <Link
          to="/breakdown"
          className="rounded-full bg-primary px-4 py-4 text-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
        >
          Continue
        </Link>
      </div>

      <BottomNav />
    </SPShell>
  );
}