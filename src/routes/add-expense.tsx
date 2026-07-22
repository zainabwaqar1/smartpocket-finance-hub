import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { CATEGORIES, CATEGORY_EMOJI, sp, useSP, type Category } from "@/lib/smartpocket-store";
import { Field, PrimaryButton, SPShell, TextInput, showToast } from "@/components/sp-shell";

export const Route = createFileRoute("/add-expense")({
  head: () => ({
    meta: [
      { title: "Add Expense — SmartPocket" },
      { name: "description", content: "Log a new expense with name, amount, category and date." },
    ],
  }),
  component: AddExpensePage,
});

function AddExpensePage() {
  const state = useSP();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false); // NEW — prevents double-submits

  // CHANGED — wait for the session to load before redirecting
  useEffect(() => {
    if (state.loading) return;
    if (!state.user) navigate({ to: "/login" });
  }, [state.loading, state.user, navigate]);

  // CHANGED — async submit: await the save, show error if it fails
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!name.trim() || !amt || amt <= 0) return;
    setSaving(true);
    const err = await sp.addExpense({
      name: name.trim().slice(0, 60),
      amount: amt,
      category,
      date: new Date(date).toISOString(),
    });
    setSaving(false);
    if (err) {
      showToast(err);
      return; // stay on the page so the user can retry
    }
    showToast("Expense added ✅");
    navigate({ to: "/" });
  }

  return (
    <SPShell title="Add Expense">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field label={<>Expense Name 🛒 :</>}>
        <TextInput
  value={name}
  onChange={(e) => setName(e.target.value)}
  maxLength={60}
  required
  placeholder="Example: Lunch"
/>
        </Field>
        <Field label={<>Amount 💵 :</>}>
        <div className="relative">
  <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
    Rs.
  </span>
  <TextInput
    inputMode="numeric"
    pattern="[0-9]*"
    value={amount}
    onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
    required
    className="pl-14"
  />
</div>
        </Field>

        <div>
          <p className="mb-3 text-base font-bold text-foreground">Category ▼</p>
          <div className="mx-auto flex w-fit flex-col items-start gap-3">
            {CATEGORIES.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-3 text-lg font-semibold">
                <input
                  type="radio"
                  name="category"
                  checked={category === c}
                  onChange={() => setCategory(c)}
                  className="sr-only"
                />
                <span
                  className={
                    "grid h-6 w-6 place-items-center rounded-full border-2 " +
                    (category === c ? "border-primary" : "border-muted-foreground/60")
                  }
                >
                  {category === c && <span className="h-3 w-3 rounded-full bg-primary" />}
                </span>
                <span className={category === c ? "text-primary" : "text-foreground"}>
                  {c} {CATEGORY_EMOJI[c]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Field label={<>Date 📅 :</>}>
          <div className="relative">
            <TextInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="h-[52px] appearance-none pr-12 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:opacity-0"
            />
            <Calendar
              size={20}
              className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-primary/70"
            />
          </div>
        </Field>

        <div className="mt-4">
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Expense"}
          </PrimaryButton>
        </div>
      </form>
    </SPShell>
  );
}