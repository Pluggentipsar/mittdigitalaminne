import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { CommandPalette } from "@/components/CommandPalette";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Mitt Digitala Minne",
  description: "Din personliga kunskapsbas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body
        className={`${dmSans.variable} ${instrumentSerif.variable} font-sans antialiased`}
      >
        <SidebarProvider>
          {/* Ambient background orbs */}
          <div
            className="ambient-orb"
            style={{
              top: "-8%",
              right: "-5%",
              width: "45vw",
              height: "45vw",
              maxWidth: "600px",
              maxHeight: "600px",
              background: "radial-gradient(circle, rgba(217, 119, 6, 0.04) 0%, rgba(180, 83, 9, 0.015) 45%, transparent 70%)",
            }}
          />
          <div
            className="ambient-orb"
            style={{
              bottom: "-15%",
              left: "10%",
              width: "35vw",
              height: "35vw",
              maxWidth: "450px",
              maxHeight: "450px",
              background: "radial-gradient(circle, rgba(124, 58, 237, 0.02) 0%, rgba(7, 89, 133, 0.015) 45%, transparent 70%)",
              animationDelay: "-12s",
              animationDuration: "30s",
            }}
          />

          <Sidebar />
          <MainContent>{children}</MainContent>
          <CommandPalette />
        </SidebarProvider>
      </body>
    </html>
  );
}
