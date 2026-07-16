import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { sp, useSP } from "@/lib/smartpocket-store";
import { Field, PrimaryButton, SPShell, TextInput } from "@/components/sp-shell";

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

  useEffect(() => {
    if (!state.user) navigate({ to: "/login" });
  }, [state.user, navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    sp.setBudget({
      allowance: Number(allowance) || 0,
      income: Number(income) || 0,
      savingsGoal: Number(savings) || 0,
      type,
    });
    navigate({ to: "/" });
  }

  return (
    <SPShell title="Let's Set Up Your Budget" showBack={!!b}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <RowField label={<>Monthly Allowance 💰</>} value={allowance} onChange={setAllowance} placeholder="Rs. 25,000" />
        <RowField label={<>Monthly Income 💼</>} value={income} onChange={setIncome} placeholder="Rs. 10,000" />
        <RowField label={<>Savings Goal 🎯</>} value={savings} onChange={setSavings} placeholder="Rs. 5,000" />

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
          <PrimaryButton type="submit">Continue</PrimaryButton>
        </div>
      </form>
    </SPShell>
  );
}

function RowField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={<span className="text-base">{label} :</span>}>
      <TextInput
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
      />
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
