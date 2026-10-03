import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GSA Farming",
  description: "Grow Health Home",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        {/* Base stylesheet — provides the shared layout primitives. */}
        <link rel="stylesheet" href="/css/style.css" />
        <link rel="stylesheet" href="/css/mui.min.css" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </body>
    </html>
  );
}