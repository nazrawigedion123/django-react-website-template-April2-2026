import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardContactsPage } from "@/routes/DashboardContactsPage";

export default function Page() {
  return (
    <RequireRole permission={["can_manage_contacts", "can_manage_subscribers"]}>
      <DashboardContactsPage />
    </RequireRole>
  );
}
