import { redirect } from "next/navigation";

// Each role dashboard is isolated. Bare /dashboard sends users back to the
// public site where they pick a role via the login modal.
export default function DashboardIndex() {
  redirect("/");
}
