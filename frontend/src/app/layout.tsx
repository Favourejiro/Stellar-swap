import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "StellarSwap",
  description: "Decentralized exchange on Stellar / Soroban",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
