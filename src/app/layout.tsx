import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import "@/styles/transitions.css";
import ReduxProvider from "@/components/providers/ReduxProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://suppliers.alaynai.com"),
  title: "Alayn Suppliers Portal | Order Fulfillment & Catalog Management",
  description:
    "Direct vendor portal for suppliers to receive restaurant purchase orders, fulfill shipments, manage inventory catalogs, and connect with restaurants on the Alayn network.",
};

const introScript = `(function(){if(typeof window==='undefined')return;if(window.location.pathname!=='/')return;var d=document.documentElement,k='alayn-intro-seen';try{if(sessionStorage.getItem(k)||matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('intro-seen');return;}sessionStorage.setItem(k,'1');}catch(e){}window.__alaynIntro='play';d.classList.add('intro-wait');var go=function(){requestAnimationFrame(function(){d.classList.remove('intro-wait');});};setTimeout(go,1200);(function wait(){var o=document.querySelector('.alayn-intro');if(!o)return requestAnimationFrame(wait);Promise.all([].map.call(o.querySelectorAll('img'),function(i){return i.decode().catch(function(){});})).then(go);})();})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="alayn-intro-decide"
          dangerouslySetInnerHTML={{ __html: introScript }}
        />
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} ${geistMono.variable} ${playfair.variable} antialiased min-h-screen`}
      >
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
