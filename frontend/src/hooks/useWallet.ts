"use client";

import { useState } from "react";

// TODO: implement Freighter wallet connection using @stellar/freighter-api
export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const connected = !!address;

  async function connect() {
    // TODO: call isConnected() + getAddress() from @stellar/freighter-api
    throw new Error("not implemented");
  }

  function disconnect() {
    setAddress(null);
  }

  return { address, connected, connect, disconnect };
}
