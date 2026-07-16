import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, User2 } from "lucide-react";

export function SPShell({
  children,
  title,
  showBack = false,
  showProfile = false,
  onProfile,
  className = "",
}: {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showProfile?: boolean;
  onProfile?: () => void;
  className?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className={cn("mx-auto flex min-h-screen max-w-md flex-col px-6 pt-6", className || "pb-24")}>
        {(title || showBack || showProfile) && (
          <header className="mb-4 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {showBack && (
                <button
                  onClick={() => navigate({ to: "/" })}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-primary transition hover:bg-primary/10"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              {title && (
                <h1 className="truncate text-2xl font-extrabold tracking-tight text-primary">
                  → {title}
                </h1>
              )}
            </div>
            {showProfile && (
              <button
                onClick={onProfile}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-foreground text-background"
                aria-label="Profile"
              >
                <User2 className="h-5 w-5" />
              </button>
            )}
          </header>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2 text-xs font-semibold">
        <NavItem to="/" label="Home" />
        <NavItem to="/breakdown" label="Breakdown" />
        <NavItem to="/history" label="History" />
        <NavItem to="/add-expense" label="Add" />
      </div>
    </nav>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex-1 rounded-lg px-2 py-2 text-center text-muted-foreground transition [&.active]:text-primary"
      activeProps={{ className: "active" }}
      activeOptions={{ exact: to === "/" }}
    >
      {label}
    </Link>
  );
}

export function Field({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-bold text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-full border-2 border-primary/60 bg-card px-5 py-3 text-base font-medium text-foreground outline-none transition placeholder:text-primary/60 focus:border-primary " +
        (props.className ?? "")
      }
    />
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-full bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-60 " +
        (props.className ?? "")
      }
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-full border-2 border-primary bg-card px-6 py-4 text-base font-bold text-primary transition active:scale-[0.98] " +
        (props.className ?? "")
      }
    >
      {children}
    </button>
  );
}
