"use client";

import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/Icon";
import { auth } from "@/lib/filesante/auth";

export function PatientLogoutButton() {
  const router = useRouter();

  function logout() {
    auth.logout();
    router.replace("/");
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="fs-btn fs-btn-neutral fs-btn-sm"
      title="Se déconnecter"
    >
      <Icon name="arrowRight" size={12} />
      Se déconnecter
    </button>
  );
}
