import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Wolfcha - 猹杀",
  description: "单人沉浸式复古童话狼人杀",
  icons: {
    icon: "/brand/wolfcha-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.loli.net" crossOrigin="anonymous" />
        <link href="https://fonts.loli.net/css2?family=Cinzel:wght@700&family=Noto+Serif+SC:wght@400;700&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Toaster position="top-center" closeButton />
        {children}
      </body>
    </html>
  );
}
