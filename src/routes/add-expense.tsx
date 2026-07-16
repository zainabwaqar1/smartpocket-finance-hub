import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_EMOJI, sp, useSP, type Category } from "@/lib/smartpocket-store";
import { Field, PrimaryButton, SPShell, TextInput } from "@/components/sp-shell";

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

  useEffect(() => {
    if (!state.user) navigate({ to: "/login" });
  }, [state.user, navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!name.trim() || !amt || amt <= 0) return;
    sp.addExpense({
      name: name.trim().slice(0, 60),
      amount: amt,
      category,
      date: new Date(date).toISOString(),
    });
    navigate({ to: "/" });
  }

  return (
    <SPShell title="Add Expense" showBack>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field label={<>Expense Name 🛒 :</>}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
        </Field>
        <Field label={<>Amount 💵 :</>}>
          <TextInput
            inputMode="numeric"
            pattern="[0-9]*"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            required
          />
        </Field>

        <div>
          <p className="mb-3 text-base font-bold text-foreground">Category ▼</p>
          <div className="flex flex-col items-center gap-3">
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
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>

        <div className="mt-4">
          <PrimaryButton type="submit">Save Expense</PrimaryButton>
        </div>
      </form>
    </SPShell>
  );
}
