"use client";

import { PaymentsContent } from "@/app/(app)/fees/payments/page";
import { PageGuard } from "@/components/common/PageGuard";

export default function AccountsPaymentsPage() {
  return (
    <PageGuard permission="fees.view">
      <PaymentsContent />
    </PageGuard>
  );
}
