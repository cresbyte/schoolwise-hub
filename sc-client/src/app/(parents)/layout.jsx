import { PortalGuard } from "@/components/portal/PortalGuard";
import { PortalLayout } from "@/components/portal/PortalLayout";

export const metadata = {
  title: "Parent Portal — ShuleSmart",
  description: "Access your children's fee statements, academic reports, attendance, and school notices.",
};

export default function ParentsRootLayout({ children }) {
  return (
    <PortalGuard>
      <PortalLayout>{children}</PortalLayout>
    </PortalGuard>
  );
}
