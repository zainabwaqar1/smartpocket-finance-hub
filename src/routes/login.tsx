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
    <SPShell className="pb-0">
      <div className="flex min-h-[calc(100vh-1.5rem)] flex-col">
        <div className="shrink-0 pt-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary">SmartPocket</h1>
            <p className="mt-2 text-base font-semibold italic text-muted-foreground">
              Track your spending. Save smarter.
            </p>
          </div>

          <form onSubmit={submit} className="mt-10 flex flex-col gap-4">
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
            <div className="px-6 pt-4">
              <PrimaryButton type="submit">{mode === "login" ? "Login" : "Sign Up"}</PrimaryButton>
            </div>
            <button
              type="button"
              className="text-center text-sm font-semibold text-primary/80 underline-offset-4 hover:underline"
              onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
            >
              {mode === "login" ? "New here? Create an account" : "Already have an account? Login"}
            </button>
          </form>
        </div>

        <div
          className="relative mt-6 min-h-0 flex-1 bg-white"
          style={{
            width: "100vw",
            marginLeft: "calc(-50vw + 50%)",
            marginRight: "calc(-50vw + 50%)",
          }}
        >
          <img
            src={studentsIllustration}
            alt="Students using SmartPocket"
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-top"
            draggable={false}
          />
        </div>
      </div>
    </SPShell>
  );
}
