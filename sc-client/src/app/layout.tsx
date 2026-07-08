import type { Metadata, Viewport } from "next";
import { ThemeRegistry } from "@/components/ThemeRegistry/ThemeRegistry";
import { ClientProviders } from "@/app/providers";
import "@/styles.css";

export const metadata: Metadata = {
  title: "ShuleSmart — School Management System",
  description: "Manage students, fees, exams, payroll and more for Kenyan private schools.",
  authors: [{ name: "ShuleSmart" }],
  openGraph: {
    title: "ShuleSmart — School Management System",
    description: "Manage students, fees, exams, payroll and more for Kenyan private schools.",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@Lovable",
  },
  icons: {
    icon: "/school-logo.png",
    apple: "/school-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <ThemeRegistry>
          <ClientProviders>{children}</ClientProviders>
        </ThemeRegistry>
      </body>
    </html>
  );
}
