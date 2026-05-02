"use client";

import { TOKEN_A, TOKEN_B } from "@/lib/constants";

// TODO: wire up getAmountOut for live quoting
// TODO: wire up swap() from lib/contract.ts
// TODO: wire up useWallet for connected state
export function SwapCard() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Swap</h2>

        {/* Token In */}
        <div className="bg-surface rounded-xl p-3 border border-border">
          <p className="text-xs text-gray-400 mb-1">You pay</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-medium outline-none placeholder-gray-600"
            />
            <span className="px-3 py-1.5 rounded-xl bg-border text-sm font-semibold">
              {TOKEN_A.symbol}
            </span>
          </div>
        </div>

        <div className="flex justify-center my-1 text-gray-500">↕</div>

        {/* Token Out */}
        <div className="bg-surface rounded-xl p-3 border border-border">
          <p className="text-xs text-gray-400 mb-1">You receive</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="0.0"
              readOnly
              className="flex-1 bg-transparent text-2xl font-medium outline-none placeholder-gray-600"
            />
            <span className="px-3 py-1.5 rounded-xl bg-border text-sm font-semibold">
              {TOKEN_B.symbol}
            </span>
          </div>
        </div>

        {/* TODO: show exchange rate once quoting is implemented */}

        <button
          disabled
          className="mt-4 w-full py-3 rounded-xl font-semibold text-sm bg-accent text-black opacity-40 cursor-not-allowed"
        >
          Swap
        </button>
      </div>
    </div>
  );
}
