import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <Sidebar />
        <main className="pt-14 md:pt-0 md:ml-[260px] min-h-screen">
          <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
