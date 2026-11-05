import type { Metadata } from "next";
import Navbar from "./components/Navbar";

import localFont from "next/font/local";
import "./globals.css";

const figtree = localFont({
  src: "./fonts/figtree-latin.woff2",
  weight: "400 700",
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Misconception",
  description: "Understand your mistakes. Strengthen your math.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Navbar />
        <div className="min-h-screen pb-20 md:pl-20 md:pb-0 xl:pl-64">
          {children}
        </div>
      </body>
    </html>
  );
}
