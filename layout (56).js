import "@fontsource-variable/montserrat";
import "@fontsource-variable/fraunces";
import "./globals.css";
import "./pages.css";
import "./f5.css";
import { SITE_URL } from "@/lib/format";

const DESC = "Formula 5 is a science-led personal care brand. Every product is built around one clearly stated hero active at a stated percentage. Precision. Purity. Performance.";
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Formula 5 | Precision. Purity. Performance.", template: "%s | Formula 5" },
  description: DESC,
  openGraph: { siteName: "Formula 5", type: "website", locale: "en_IN", url: SITE_URL, title: "Formula 5 | Precision. Purity. Performance.", description: DESC },
  twitter: { card: "summary_large_image" },
};
export const viewport = { themeColor: "#FBF9F4", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
