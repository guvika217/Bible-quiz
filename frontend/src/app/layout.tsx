import type { Metadata, Viewport } from "next";
import { Header, Footer } from "@/components/layout";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Bible Quiz Platform | Enterprise Biblical Knowledge Engine",
  description:
    "Production-grade, highly scalable Bible quiz and trivia application built with Next.js, Python FastAPI, and modern cloud infrastructure.",
  keywords: ["Bible Quiz", "Scripture Trivia", "Enterprise Architecture", "FastAPI", "Next.js"],
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
