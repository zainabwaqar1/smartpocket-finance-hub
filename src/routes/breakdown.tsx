import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  byCategory,
  CATEGORY_EMOJI,
  formatRs,
  monthlyBudget,
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

  useEffect(() => {
    if (!state.user) navigate({ to: "/login" });
    else if (!state.budget) navigate({ to: "/setup" });
  }, [state.user, state.budget, navigate]);

  const data = useMemo(() => byCategory(state.expenses), [state.expenses]);
  const spent = totalSpent(state.expenses);
  const budget = monthlyBudget(state.budget);
  const used = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  return (
    <SPShell title="Spending Breakdown" showBack>
      <div className="flex flex-col gap-8">
        <div className="relative h-72">
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
                    label={({ category, percent }) =>
                      `${category} ${((percent ?? 0) * 100).toFixed(1)}%`
                    }
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

        <section>
          <h2 className="text-xl font-extrabold text-primary">→ Budget Status ({Math.round(used)}% used)</h2>
          <div className="mt-3 h-5 w-full overflow-hidden rounded-full bg-primary-soft/50">
            <div
              className="h-full rounded-full bg-primary transition-all"
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
