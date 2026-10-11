"use client";

import { InvoicesContent } from "@/app/(app)/fees/invoices/page";
import { PageGuard } from "@/components/common/PageGuard";

export default function AccountsInvoicesPage() {
  return (
    <PageGuard permission="fees.view">
      <InvoicesContent />
    </PageGuard>
  );
}
