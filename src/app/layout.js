import "@/styles/globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar.js";
import Footer from "@/components/Footer";
import GlobalWalletManager from "@/components/GlobalWalletManager";
import FontLoader from "@/components/FontLoader";

export const metadata = {
  title: "APT Casino",
  description: "APT Casino",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/ClashDisplay-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/PlusJakartaSans-VariableFont.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body 
        className="font-sans overflow-x-hidden w-full"
        suppressHydrationWarning={true}
      >
        <Providers>
          <FontLoader />
          <GlobalWalletManager />
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
