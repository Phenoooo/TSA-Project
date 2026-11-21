import "./globals.css";
import React from "react";

export const metadata = {
  title: "Unified Math Platform",
  description: "Adaptive Math ELO Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}