import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import ExtensionErrorBoundary from "@/components/ExtensionErrorBoundary";

export const metadata: Metadata = {
  title: "TNMatrix Notes Editor",
  description: "Manage your tasks and notes with the FranklinCovey Time Matrix.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ExtensionErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ExtensionErrorBoundary>
      </body>
    </html>
  );
}