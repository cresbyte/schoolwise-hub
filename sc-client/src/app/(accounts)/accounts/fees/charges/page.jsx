"use client";

import { ChargesContent } from "@/app/(app)/fees/charges/page";
import { PageGuard } from "@/components/common/PageGuard";

export default function ChargesPage() {
  return (
    <PageGuard permission="fees.view">
      <ChargesContent />
    </PageGuard>
  );
}
