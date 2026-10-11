import { StaffLayout } from "@/components/layout/StaffLayout";

export const metadata = {
  title: "Staff Portal — ShuleSmart",
  description: "Staff and teacher portal for attendance, grading, classes, and leave requests.",
};

export default function StaffGroupLayout({ children }) {
  return <StaffLayout>{children}</StaffLayout>;
}
