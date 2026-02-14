// Force CI trigger - notification fix deployment
import type { Metadata } from "next";
import { Rubik, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ApiProvider } from "@/components/api-provider";
import { RecalculationIndicator } from "@/components/recalculation-indicator";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Precificação - Sistema de Gestão de Custos",
  description: "Sistema completo para calcular custos e precificar produtos",
};

// Force dynamic rendering for all pages (required for Clerk authentication)
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR">
        <body
          className={`${rubik.variable} ${geistMono.variable} font-sans antialiased`}
        >
          <ApiProvider>
            {children}
            <RecalculationIndicator />
          </ApiProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
