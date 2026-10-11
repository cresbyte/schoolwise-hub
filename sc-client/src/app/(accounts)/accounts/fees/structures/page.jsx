"use client";

import { FeeStructuresContent } from "@/app/(app)/fees/structures/page";
import { PageGuard } from "@/components/common/PageGuard";

export default function AccountsFeeStructuresPage() {
  return (
    <PageGuard permission="fees.view">
      <FeeStructuresContent />
    </PageGuard>
  );
}
