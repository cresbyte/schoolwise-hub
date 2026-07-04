"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";

export default function ClassesLayout({ children }) {
  const pathname = usePathname();

  let currentTab = 0;
  if (pathname.includes("/settings/classes/subjects/assignments")) currentTab = 3;
  else if (pathname.includes("/settings/classes/subjects/setup")) currentTab = 2;
  else if (pathname.includes("/settings/classes/subjects")) currentTab = 1;

  // The inner pages do not need to wrap themselves with DashboardLayout again,
  // but to prevent removing DashboardLayout from deep pages like [id]/edit individually,
  // we can use DashboardLayout here, and strip outer wrapping from the raw pages.
  // Actually Next.js layouts wrap children, so if the child also returns a DashboardLayout,
  // it might nest twice (two sidebars). I will remove it from the page files.
  
  return (
    <DashboardLayout>
      <PageHeader title="Classes & Subjects" subtitle="Manage academic structures" />
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={currentTab} variant="scrollable" scrollButtons="auto">
          <Tab label="Classes" component={Link} href="/settings/classes" />
          <Tab label="Subjects" component={Link} href="/settings/classes/subjects" />
          <Tab label="Grade Setup" component={Link} href="/settings/classes/subjects/setup" />
          <Tab label="Assignments" component={Link} href="/settings/classes/subjects/assignments" />
        </Tabs>
      </Box>
      {children}
    </DashboardLayout>
  );
}
