import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ApiProvider } from "@/components/api-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ApiProvider>
            {children}
          </ApiProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
