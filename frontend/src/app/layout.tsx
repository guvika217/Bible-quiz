import type { Metadata, Viewport } from "next";
import { Header, Footer } from "@/components/layout";
import { AuthProvider } from "@/components/layout/AuthContext";
import { FloatingRefreshButton } from "@/components/common/FloatingRefreshButton";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Bible Quiz Platform | Interactive Biblical Knowledge Engine",
  description:
    "Production-grade, highly scalable Bible quiz and trivia application with live leaderboards, quiz management, and performance analytics.",
  keywords: ["Bible Quiz", "Scripture Trivia", "Christian Quiz", "Leaderboards", "FastAPI", "Next.js"],
  authors: [{ name: "Bible Quiz Platform Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className="min-h-full flex flex-col font-sans text-slate-800">
        <AuthProvider>
          <Header />
          <FloatingRefreshButton />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
