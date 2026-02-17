import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/public/Navigation";
import Footer from "@/components/public/Footer";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Nzila Ventures | Venture Studio & Ethical IP-Holding Company",
  description: "Advancing human-centered solutions in care, cognition, learning, and equity across 10 verticals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
