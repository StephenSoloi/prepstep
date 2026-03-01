import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrepStep - AI Mock Interviews",
  description: "Upload your resume and get a real-time, interactive mock interview using Voice AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
