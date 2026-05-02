"use client";

import { useState } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { SwapCard } from "@/components/SwapCard";
import { PoolCard } from "@/components/PoolCard";

export default function Home() {
  const [tab, setTab] = useState<"swap" | "pool">("swap");

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold text-accent">⭐ StellarSwap</span>
          <div className="flex gap-1">
            {(["swap", "pool"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors capitalize ${
                  tab === t
                    ? "bg-border text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <ConnectWallet />
      </nav>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {tab === "swap" ? <SwapCard /> : <PoolCard />}
      </main>

      <footer className="text-center text-xs text-gray-600 py-4">
        Stellar Testnet · Powered by Soroban
      </footer>
    </div>
  );
}
