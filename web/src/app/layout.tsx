import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
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
        <Sidebar />
        <main className="pt-14 md:pt-0 md:ml-[272px] min-h-screen">
          <div className="max-w-6xl mx-auto px-5 py-8 md:px-10 md:py-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
