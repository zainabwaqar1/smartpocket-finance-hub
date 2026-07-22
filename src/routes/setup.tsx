import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { sp, useSP } from "@/lib/smartpocket-store";
import { Field, PrimaryButton, SPShell, TextInput, showToast } from "@/components/sp-shell";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Set Up Your Budget — SmartPocket" },
      { name: "description", content: "Enter your monthly allowance, income and savings goal to get started." },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const state = useSP();
  const b = state.budget;
  const [allowance, setAllowance] = useState(b?.allowance.toString() ?? "");
  const [income, setIncome] = useState(b?.income.toString() ?? "");
  const [savings, setSavings] = useState(b?.savingsGoal.toString() ?? "");
  const [type, setType] = useState<"Weekly" | "Monthly">(b?.type ?? "Monthly");
  const [saving, setSaving] = useState(false); // NEW

  // CHANGED — wait for the session to load before redirecting
  useEffect(() => {
    if (state.loading) return;
    if (!state.user) navigate({ to: "/login" });
  }, [state.loading, state.user, navigate]);

  // NEW — budget arrives async from the database; fill the fields once it lands
  useEffect(() => {
    if (b) {
      setAllowance(b.allowance.toString());
      setIncome(b.income.toString());
      setSavings(b.savingsGoal.toString());
      setType(b.type);
    }
  }, [b]);

  // CHANGED — async submit: await the save, show error if it fails
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const err = await sp.setBudget({
      allowance: Number(allowance) || 0,
      income: Number(income) || 0,
      savingsGoal: Number(savings) || 0,
      type,
    });
    setSaving(false);
    if (err) {
      showToast(err);
      return;
    }
    showToast("Budget saved ✅");
    navigate({ to: "/" });
  }

  return (
    <SPShell title="Let's Set Up Your Budget">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <RowField label={<>Monthly Allowance 💰</>} value={allowance} onChange={setAllowance} />
        <RowField label={<>Monthly Income 💼</>} value={income} onChange={setIncome} />
        <RowField label={<>Savings Goal 🎯</>} value={savings} onChange={setSavings} />

        <div className="mt-4">
          <h2 className="text-xl font-extrabold text-foreground">→ Budget Type</h2>
          <div className="mt-3 flex flex-col items-center gap-3">
            <RadioRow name="type" label="Weekly" checked={type === "Weekly"} onChange={() => setType("Weekly")} />
            <RadioRow name="type" label="Monthly" checked={type === "Monthly"} onChange={() => setType("Monthly")} />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border-2 border-primary/40 bg-primary/10 px-5 py-5 text-center">
          <p className="text-lg font-extrabold text-primary">✅ You're all set!</p>
          <p className="mt-2 text-sm font-semibold text-primary/80">
            Let's create a budget based on your monthly allowance and income.
          </p>
        </div>

        <div className="mt-4">
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Saving…" : "Continue"}
          </PrimaryButton>
        </div>
      </form>
    </SPShell>
  );
}

/* RowField with a permanent "Rs." prefix inside the input */
function RowField({
  label,
  value,
  onChange,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={<span className="text-base">{label} :</span>}>
      <div className="relative">
        <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
          Rs.
        </span>
        <TextInput
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          className="pl-14"
        />
      </div>
    </Field>
  );
}

function RadioRow({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-lg font-bold">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={
          "grid h-6 w-6 place-items-center rounded-full border-2 " +
          (checked ? "border-primary" : "border-muted-foreground/60")
        }
      >
        {checked && <span className="h-3 w-3 rounded-full bg-primary" />}
      </span>
      <span className={checked ? "text-primary" : "text-foreground"}>{label}</span>
    </label>
  );
}