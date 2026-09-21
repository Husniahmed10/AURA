import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Providers from "./providers";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
export const metadata: Metadata = {
  title: "AURA | AI Security Workspace",
  description:
    "Assess, understand, and strengthen the security of your AI applications.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Providers>
          <div className="console-shell">
            <Sidebar />
            <div className="console-body">
              <Header />
              <main id="main-content" className="console-main">
                {children}
              </main>
              <footer className="console-footer">
                <span>AURA / Autonomous AI security</span>
                <span>Built for confidence.</span>
              </footer>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
