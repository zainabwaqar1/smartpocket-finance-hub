import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { sp, useSP } from "@/lib/smartpocket-store";
import { Field, PrimaryButton, SPShell, TextInput } from "@/components/sp-shell";
import studentsIllustration from "@/assets/login-students.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — SmartPocket" },
      { name: "description", content: "Sign in to SmartPocket to track your spending and save smarter." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const state = useSP();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    sp.login(email.trim());
    navigate({ to: state.budget ? "/" : "/setup" });
  }

  return (
    <SPShell>
      <div className="flex min-h-[80vh] flex-col justify-center gap-8 pb-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">SmartPocket</h1>
          <p className="mt-2 text-base font-semibold italic text-muted-foreground">
            Track your spending. Save smarter.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="">
            <TextInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>
          <Field label="">
            <TextInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </Field>
          <div className="pt-2">
            <PrimaryButton type="submit">{mode === "login" ? "Login" : "Sign Up"}</PrimaryButton>
          </div>
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-primary/80 underline-offset-4 hover:underline"
            onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
          >
            {mode === "login" ? "New here? Create an account" : "Already have an account? Login"}
          </button>
        </form>

        <div aria-hidden className="pointer-events-none mt-4 select-none text-center text-[6rem] leading-none opacity-40">
          👥💰📊
        </div>
      </div>
    </SPShell>
  );
}
