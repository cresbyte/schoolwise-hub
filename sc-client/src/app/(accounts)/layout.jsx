import { AccountsLayout } from "@/components/layout/AccountsLayout";

export const metadata = {
  title: "Accounts Portal — ShuleSmart",
  description: "Finance and fee management, student invoicing, and payment reconciliation.",
};

export default function AccountsGroupLayout({ children }) {
  return <AccountsLayout>{children}</AccountsLayout>;
}
