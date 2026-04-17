import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardSettingsPage } from "@/routes/DashboardSettingsPage";

export default function Page() {
  return (
    <RequireRole permission="can_manage_settings">
      <DashboardSettingsPage />
    </RequireRole>
  );
}
