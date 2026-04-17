import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardUsersPage } from "@/routes/DashboardUsersPage";

export default function Page() {
  return (
    <RequireRole permission="can_manage_users">
      <DashboardUsersPage />
    </RequireRole>
  );
}
