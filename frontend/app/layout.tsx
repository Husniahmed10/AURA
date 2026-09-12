import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AURA - AI Red Teaming Agent",
  description: "Enterprise Security Assessment Platform for LLMs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          {/* Note: In shadcn, Toaster is usually used from a hook, but we place the provider here if using sonner or standard toaster */}
        </Providers>
      </body>
    </html>
  );
}
