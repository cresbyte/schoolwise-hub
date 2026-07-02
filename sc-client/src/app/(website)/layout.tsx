"use client";

import { WebsiteLayout } from "@/components/website/WebsiteLayout";

export default function PublicWebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WebsiteLayout>{children}</WebsiteLayout>;
}
