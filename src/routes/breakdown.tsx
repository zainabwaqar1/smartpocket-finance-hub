import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  budgetAmount,
  byCategory,
  CATEGORY_EMOJI,
  expensesInPeriod,
  formatRs,
  totalSpent,
  useSP,
} from "@/lib/smartpocket-store";
import { BottomNav, SPShell } from "@/components/sp-shell";

const COLORS = [
  "#5A8DEE", // Food
  "#B29CEF", // Travel
  "#F1A66A", // Shopping
  "#F5D45B", // Entertainment
  "#E5606F", // Mobile
  "#E087C3", // Miscellaneous
];

export const Route = createFileRoute("/breakdown")({
  head: () => ({
    meta: [
      { title: "Spending Breakdown — SmartPocket" },
      { name: "description", content: "See where your money goes with a category breakdown and budget status." },
    ],
  }),
  component: BreakdownPage,
});

function BreakdownPage() {
  const state = useSP();
  const navigate = useNavigate();

  // wait for the session/data to load before redirecting
  useEffect(() => {
    if (state.loading) return;
    if (!state.user) navigate({ to: "/login" });
    else if (!state.budget) navigate({ to: "/setup" });
  }, [state.loading, state.user, state.budget, navigate]);

  const periodExpenses = useMemo(
    () => (state.budget ? expensesInPeriod(state.expenses, state.budget.type) : []),
    [state.expenses, state.budget],
  );
  const data = useMemo(() => byCategory(periodExpenses), [periodExpenses]);
  const spent = totalSpent(periodExpenses);
  const budget = budgetAmount(state.budget);
  const usedPct = budget > 0 ? (spent / budget) * 100 : 0;
  const used = Math.min(usedPct, 100); // bar width caps at 100

  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  const total = data.reduce((s, d) => s + d.amount, 0);

  // loading screen while session/data fetches
  if (state.loading) {
    return (
      <SPShell title="Spending Breakdown">
        <div className="grid min-h-[60vh] place-items-center">
          <p className="text-sm font-semibold text-muted-foreground">Loading…</p>
        </div>
      </SPShell>
    );
  }

  return (
    <SPShell title="Spending Breakdown">
      <div className="flex flex-col gap-8">
        <div>
          <div className="relative h-64">
            {data.length === 0 ? (
              <div className="grid h-full place-items-center rounded-3xl border-2 border-dashed border-primary/40 text-center text-primary/70">
                <p className="px-6 text-sm font-semibold">
                  No expenses yet. Add one to see your spending breakdown.
                </p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={1}
                      stroke="none"
                    >
                      {data.map((d, i) => (
                        <Cell key={d.category} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{formatRs(spent)}</p>
                    <p className="text-xs font-semibold text-muted-foreground">Spent</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* legend with color dots, category names and percentages */}
          {data.length > 0 && (
            <div className="mx-auto mt-4 grid w-fit grid-cols-2 gap-x-6 gap-y-2">
              {data.map((d, i) => (
                <div key={d.category} className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-foreground/80">
                    {d.category} {CATEGORY_EMOJI[d.category]}
                  </span>
                  <span className="ml-auto text-muted-foreground">
                    {total > 0 ? ((d.amount / total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <section>
          <h2 className={"text-xl font-extrabold " + (usedPct > 100 ? "text-destructive" : "text-primary")}>
            Budget Status ({Math.round(usedPct)}% used)
          </h2>
          <div className="mt-3 h-5 w-full overflow-hidden rounded-full bg-primary-soft/50">
            <div
              className={"h-full rounded-full transition-all " + (usedPct > 100 ? "bg-destructive" : "bg-primary")}
              style={{ width: `${used}%` }}
            />
          </div>
        </section>

        {highest && lowest && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Highest expense"
              accent="text-[#E58A3A]"
              label={`${highest.category} ${CATEGORY_EMOJI[highest.category]}`}
              value={formatRs(highest.amount)}
            />
            <StatCard
              title="Lowest expense"
              accent="text-primary"
              label={`${lowest.category} ${CATEGORY_EMOJI[lowest.category]}`}
              value={formatRs(lowest.amount)}
            />
          </div>
        )}
      </div>

      {/* NEW — Continue button to History */}
      <div className="mt-8">
        <Link
          to="/history"
          className="block rounded-full bg-primary px-4 py-4 text-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
        >
          Continue
        </Link>
      </div>

      <BottomNav />
    </SPShell>
  );
}

function StatCard({
  title,
  label,
  value,
  accent,
}: {
  title: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 text-center shadow-sm">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className={"mt-2 text-base font-bold " + accent}>{label}</p>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">{value}</p>
    </div>
  );
}