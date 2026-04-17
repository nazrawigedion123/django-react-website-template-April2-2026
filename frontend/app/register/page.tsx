import { RequireGuest } from "@/components/auth/RequireGuest";
import { RegisterPage } from "@/routes/RegisterPage";

export default function Page() {
  return (
    <RequireGuest>
      <RegisterPage />
    </RequireGuest>
  );
}
