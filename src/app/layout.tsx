import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";

const geist = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "thirdweb SDK + Next starter",
  description:
    "Starter template for using thirdweb SDK with Next.js App router",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable}`}>
        <ThirdwebProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  // simple theme sync using data stored in localStorage
  // avoids SSR mismatch via suppressHydrationWarning
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              const theme = localStorage.getItem('theme') || 'dark';
              if (theme === 'dark') document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');
            } catch {}
          `,
        }}
      />
      {children}
    </>
  );
}
