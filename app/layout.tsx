import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Sans, Fraunces } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { isClerkConfigured } from "@/lib/clerk-config";
import { ClerkSetupNotice } from "@/components/clerk-setup-notice";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kuku Farm",
  description: "Track flocks, eggs, expenses, and sell produce online.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const clerkReady = isClerkConfigured();

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {clerkReady ? (
          <ClerkProvider>
            {children}
            <Toaster />
          </ClerkProvider>
        ) : (
          <ClerkSetupNotice />
        )}
      </body>
    </html>
  );
}
