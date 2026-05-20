"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useAuth, type AuthRole } from "@/lib/filesante/auth";

type Props = {
  /** Required role(s). If user role doesn't match, redirect to home. */
  allow: AuthRole | AuthRole[];
  children: ReactNode;
};

// Client-side gate. Mounted inside protected dashboard layouts.
// On first render (pre-hydration) the auth store reports null, so we
// hold a "checking" state until the auth subscription delivers the real
// value, then either render children or redirect.
export function AuthGate({ allow, children }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);

  const allowedRoles = Array.isArray(allow) ? allow : [allow];

  useEffect(() => {
    // After the first paint, mark checked. useAuth hydrates inside its
    // own effect, so the next render has the real user value.
    const t = window.setTimeout(() => setChecked(true), 30);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!user) {
      router.replace("/?login=1");
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace("/?login=1");
    }
  }, [checked, user, allowedRoles, router]);

  if (!checked) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-[13px] text-[var(--ap-ink-muted-80)]">
        Vérification de session…
      </div>
    );
  }
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }
  return <>{children}</>;
}
