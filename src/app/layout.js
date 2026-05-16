import { Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar.js";
import Footer from "@/components/Footer";
import GlobalWalletManager from "@/components/GlobalWalletManager";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata = {
  title: "APT Casino",
  description: "APT Casino",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakarta.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
        />
      </head>
      <body
        className="font-sans overflow-x-hidden w-full"
        suppressHydrationWarning={true}
      >
        <Providers>
          <GlobalWalletManager />
          <Navbar />
          {/* Offset for fixed navbar (matches nav vertical padding + one-line content) */}
          <main className="w-full min-w-0 pt-[4.5rem] sm:pt-[4.75rem] md:pt-[5rem]">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
