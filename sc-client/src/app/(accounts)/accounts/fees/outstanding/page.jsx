"use client";

import { OutstandingContent } from "@/app/(app)/fees/outstanding/page";
import { PageGuard } from "@/components/common/PageGuard";

export default function AccountsOutstandingPage() {
  return (
    <PageGuard permission="fees.view">
      <OutstandingContent />
    </PageGuard>
  );
}
