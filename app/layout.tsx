import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Toaster from "@/components/Toast";

export const metadata: Metadata = {
  title: "Fitted — Outfit Builder & Style Check",
  description:
    "Build outfits from your favourite shops, save your fits and wishlist, and get an editorial style check on every look.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%2317130f'/><text x='16' y='23' font-family='Georgia,serif' font-size='20' fill='%23fbf7ef' text-anchor='middle'>F</text></svg>"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400;1,6..96,500&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="shell">
          <Nav />
          <main>{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
