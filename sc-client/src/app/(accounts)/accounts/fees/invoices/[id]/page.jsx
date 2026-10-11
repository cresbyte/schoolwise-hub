"use client";

import { InvoiceDetailContent } from "@/app/(app)/fees/invoices/[id]/page";
import { PageGuard } from "@/components/common/PageGuard";

export default function AccountsInvoiceDetailPage() {
  return (
    <PageGuard permission="fees.view">
      <InvoiceDetailContent />
    </PageGuard>
  );
}
