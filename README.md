# StellarSwap

A decentralized exchange (DEX) built on the Stellar network, modeled after Uniswap v2. It uses Soroban smart contracts (Rust) for the on-chain Automated Market Maker (AMM) logic and a Next.js + Tailwind CSS frontend for the user interface. Wallet connectivity is handled by the Freighter browser extension.

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Smart Contract](#smart-contract)
6. [Frontend](#frontend)
7. [Tech Stack](#tech-stack)
8. [Current Status](#current-status)
9. [Setup & Development](#setup--development)
10. [Deployment](#deployment)
11. [Configuration](#configuration)
12. [Key Design Decisions](#key-design-decisions)

---

## Overview

StellarSwap lets users:

- **Swap** between two Stellar assets (XLM and USDC by default) directly from their browser wallet.
- **Provide liquidity** by depositing both tokens into the pool and earning a share of trading fees.
- **Remove liquidity** by burning their LP (liquidity provider) shares to reclaim their proportional token amounts.

Everything runs on Stellar Testnet. No order book, no intermediary — trades are settled instantly against the on-chain liquidity pool.

---

## How It Works

### The AMM Formula

StellarSwap uses the **constant product formula**:

```
x * y = k
```

Where `x` and `y` are the pool's reserves of token A and token B, and `k` is a constant that must hold before and after every trade (minus fees). This means:

- As you buy token B (reducing `y`), the price of B rises because `x` must increase to keep `k` constant.
- Large trades relative to pool size cause more price impact (slippage).
- The pool is always liquid — it never runs out of either token, it just becomes increasingly expensive.

### Swap Mechanics

When a user swaps `amount_in` of token A for token B:

1. A **0.3% fee** is deducted: `amount_in_with_fee = amount_in × 997`
2. The output is calculated:
   ```
   amount_out = (reserve_b × amount_in_with_fee) / (reserve_a × 1000 + amount_in_with_fee)
   ```
3. The fee stays in the pool, growing reserves over time — this is how LPs earn yield.
4. The user specifies a `min_amount_out` for **slippage protection**. If the actual output falls below this, the transaction reverts.

### Liquidity Provision

When a user deposits tokens:

- **First deposit**: LP shares are minted as the geometric mean of the two amounts (`√(amount_a × amount_b)`). This prevents ratio manipulation on the initial deposit.
- **Subsequent deposits**: Shares are minted proportionally to the existing reserves. The smaller of the two ratios is used, enforcing the current pool price.
- LP shares are stored per-user in `persistent` contract storage.

When a user withdraws:

- Their shares are burned and they receive a pro-rata portion of both reserves:
  ```
  amount_a = shares × reserve_a / total_shares
  amount_b = shares × reserve_b / total_shares
  ```

### Transaction Flow (Frontend → Chain)

Every state-changing action follows this pipeline:

```
1. Build transaction  →  TransactionBuilder + contract.call(method, ...args)
2. Simulate           →  server.simulateTransaction(tx)  [gets fee footprint]
3. Assemble           →  SorobanRpc.assembleTransaction(tx, simResult)
4. Sign               →  Freighter extension signs the XDR (private key never leaves browser)
5. Submit             →  server.sendTransaction(signedTx)
6. Poll               →  server.getTransaction(hash) until confirmed or failed
```

Read-only calls (quotes, reserve lookups) skip steps 4–6 and only simulate.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│                                                     │
│  ┌──────────────┐    ┌──────────────────────────┐  │
│  │   Next.js    │    │   Freighter Extension    │  │
│  │   Frontend   │◄──►│   (signs transactions)   │  │
│  └──────┬───────┘    └──────────────────────────┘  │
│         │                                           │
└─────────┼───────────────────────────────────────────┘
          │ @stellar/stellar-sdk (RPC calls)
          ▼
┌─────────────────────┐
│  Stellar Testnet    │
│  Soroban RPC Node   │
│  (soroban-testnet   │
│   .stellar.org)     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│              Soroban Smart Contracts                │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  LiquidityPool Contract (Rust)               │  │
│  │                                              │  │
│  │  initialize(token_a, token_b)                │  │
│  │  deposit(from, amount_a, amount_b) → shares  │  │
│  │  withdraw(from, shares) → (amount_a, amount_b)│  │
│  │  swap(from, token_in, amount_in, min_out)    │  │
│  │  get_reserves() → (reserve_a, reserve_b)     │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────┐    ┌──────────────────────────┐  │
│  │  XLM SAC     │    │  USDC SAC                │  │
│  │  (native     │    │  (Stellar Asset          │  │
│  │   wrapped)   │    │   Contract)              │  │
│  └──────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
stellar-swap/
├── Cargo.toml                          # Rust workspace root
├── package.json                        # npm workspace root
├── README.md
│
├── contracts/
│   └── liquidity_pool/
│       ├── Cargo.toml                  # soroban-sdk dependency
│       └── src/
│           └── lib.rs                  # AMM contract (x*y=k)
│
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── layout.tsx              # Root HTML layout, global CSS
        │   └── page.tsx                # Navbar + Swap/Pool tab switcher
        ├── components/
        │   ├── ConnectWallet.tsx       # Freighter connect/disconnect button
        │   ├── SwapCard.tsx            # Swap UI (token inputs, rate, CTA)
        │   └── PoolCard.tsx            # Add/remove liquidity UI
        ├── hooks/
        │   └── useWallet.ts            # Freighter wallet state hook
        └── lib/
            ├── constants.ts            # RPC URL, contract IDs, token config
            └── contract.ts             # Soroban transaction helpers
```

---

## Smart Contract

**File:** `contracts/liquidity_pool/src/lib.rs`

Written in Rust using the Soroban SDK. Compiled to WebAssembly and deployed on-chain.

### Storage Layout

| Key | Type | Storage Tier | Description |
|---|---|---|---|
| `TokenA` | `Address` | `instance` | Token A contract address |
| `TokenB` | `Address` | `instance` | Token B contract address |
| `ReserveA` | `i128` | `instance` | Current token A reserve |
| `ReserveB` | `i128` | `instance` | Current token B reserve |
| `TotalShares` | `i128` | `instance` | Total LP shares outstanding |
| `Shares(Address)` | `i128` | `persistent` | LP shares per user |

`instance` storage lives as long as the contract and is cheap for frequently-updated shared state. `persistent` storage survives ledger expiry (if rent is paid) and is used for per-user data.

### Contract Functions

#### `initialize(env, token_a, token_b)`
One-time setup. Stores the two token addresses and zeroes all reserves. Panics if called again.

#### `deposit(env, from, amount_a, amount_b) → i128`
- Requires `from` to have authorized the call (`from.require_auth()`)
- Transfers `amount_a` and `amount_b` from the user into the contract
- Mints LP shares: geometric mean on first deposit, proportional minimum on subsequent deposits
- Updates reserves and the user's share balance
- Emits a `DEPOSIT` event

#### `withdraw(env, from, shares) → (i128, i128)`
- Burns `shares` from the user's balance
- Returns `(amount_a, amount_b)` proportional to their share of the pool
- State is updated before token transfers (checks-effects-interactions pattern)
- Emits a `WITHDRAW` event

#### `swap(env, from, token_in, amount_in, min_amount_out) → i128`
- Accepts either token as input, automatically determines direction
- Applies 0.3% fee: `amount_in_with_fee = amount_in × 997`
- Computes output: `(reserve_out × amount_in_with_fee) / (reserve_in × 1000 + amount_in_with_fee)`
- Reverts if `amount_out < min_amount_out` (slippage protection)
- Emits a `SWAP` event

#### `get_reserves(env) → (i128, i128)`
Read-only. Returns current `(reserve_a, reserve_b)`.

### Authorization Model

Soroban's `address.require_auth()` instructs the host to verify that the given address cryptographically signed the current transaction invocation. No manual signature verification is needed in contract code — the host enforces it at the protocol level.

---

## Frontend

**Framework:** Next.js 14 (App Router), TypeScript, Tailwind CSS

### `src/lib/constants.ts`
Central config: Stellar Testnet RPC URL, network passphrase, pool contract ID, and token definitions (symbol, contract ID, decimals). Update this file after deploying your contract.

### `src/lib/contract.ts`
TypeScript wrappers for every contract function. Each mutating function follows the simulate → assemble → sign → submit → poll pipeline using `@stellar/stellar-sdk`. Read-only functions (`getAmountOut`, `getReserves`) only simulate — no signing required.

### `src/hooks/useWallet.ts`
React hook managing Freighter wallet state: `address`, `connected`, `connect()`, `disconnect()`. Uses `@stellar/freighter-api` to request the user's public key.

### `src/components/ConnectWallet.tsx`
Button in the top-right navbar. Shows a truncated address when connected, or a "Connect Wallet" prompt when not.

### `src/components/SwapCard.tsx`
The main trading interface:
- Two token input fields (pay / receive)
- Token flip button (↕)
- Live exchange rate display
- Slippage tolerance selector (0.1% / 0.5% / 1%)
- Auto-quotes output via `getAmountOut` as the user types
- Calls `swap()` on submit with slippage-adjusted `min_amount_out`

### `src/components/PoolCard.tsx`
Liquidity management interface:
- Add Liquidity tab: two amount inputs, auto-fills token B based on current pool ratio
- Remove Liquidity tab: enter LP share amount to burn
- Displays live pool reserves

### `src/app/page.tsx`
Root page. Renders the navbar (logo + Swap/Pool tabs + ConnectWallet) and conditionally shows `SwapCard` or `PoolCard`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contracts | Rust, Soroban SDK 21, `wasm32-unknown-unknown` |
| Blockchain | Stellar Testnet, Soroban RPC |
| Frontend framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS 3 |
| Wallet | Freighter (`@stellar/freighter-api`) |
| Chain interaction | `@stellar/stellar-sdk` 12 |
| Build | Cargo (contracts), npm workspaces (frontend) |

---

## Current Status

The project is **~30% complete**. The scaffolding, configuration, and architecture are fully in place. Core logic is stubbed and ready to be implemented.

| Component | Status |
|---|---|
| Monorepo structure & config | ✅ Complete |
| Contract: `initialize` | ✅ Complete |
| Contract: `get_reserves` | ✅ Complete |
| Contract: `deposit` | 🔧 Stub — not implemented |
| Contract: `withdraw` | 🔧 Stub — not implemented |
| Contract: `swap` | 🔧 Stub — not implemented |
| Frontend: layout, navbar, routing | ✅ Complete |
| Frontend: `SwapCard` skeleton UI | ✅ Complete |
| Frontend: `PoolCard` skeleton UI | ✅ Complete |
| Wallet hook (`useWallet`) | 🔧 Stub — not implemented |
| Contract integration (`contract.ts`) | 🔧 Stub — not implemented |
| Live quoting | 🔧 Pending contract integration |
| Testnet deployment | ⏳ Not yet deployed |

---

## Setup & Development

### Prerequisites

- Rust with the `wasm32-unknown-unknown` target
- Soroban CLI
- Node.js 18+
- [Freighter wallet](https://www.freighter.app/) browser extension (set to Testnet)

```bash
# Rust WASM target
rustup target add wasm32-unknown-unknown

# Soroban CLI
cargo install --locked soroban-cli

# Frontend dependencies
cd frontend && npm install
```

### Run the frontend

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

### Build the contract

```bash
# From repo root
cargo build --target wasm32-unknown-unknown --release
# Output: target/wasm32-unknown-unknown/release/liquidity_pool.wasm

# Run contract tests
cargo test
```

---

## Deployment

### 1. Wrap native XLM as a SAC

```bash
soroban contract asset deploy \
  --asset native \
  --network testnet \
  --source <YOUR_SECRET_KEY>
```

### 2. Deploy the pool contract

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/liquidity_pool.wasm \
  --network testnet \
  --source <YOUR_SECRET_KEY>
# → outputs POOL_CONTRACT_ID
```

### 3. Initialize the pool

```bash
soroban contract invoke \
  --id <POOL_CONTRACT_ID> \
  --network testnet \
  --source <YOUR_SECRET_KEY> \
  -- initialize \
  --token_a <XLM_SAC_CONTRACT_ID> \
  --token_b <USDC_SAC_CONTRACT_ID>
```

---

## Configuration

After deployment, update `frontend/src/lib/constants.ts`:

```ts
export const POOL_CONTRACT_ID = "<your deployed pool contract ID>";

export const TOKEN_A = {
  id: "<XLM SAC contract ID>",
  symbol: "XLM",
  decimals: 7,
};

export const TOKEN_B = {
  id: "<USDC SAC contract ID>",
  symbol: "USDC",
  decimals: 7,
};
```

All amounts in the contract are in **stroops** (1 XLM = 10,000,000 stroops, i.e. 7 decimal places).

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| `x * y = k` constant product | Matches Uniswap v2 — simple, battle-tested, no oracle dependency |
| 0.3% fee (`× 997 / 1000`) | Industry standard; fee stays in reserves and accrues to LPs passively |
| `require_auth()` for authorization | Soroban host enforces cryptographic authorization — no manual sig verification needed |
| `instance` storage for reserves | Shared pool state updated on every trade; instance storage is cheapest for this |
| `persistent` storage for LP shares | Per-user data that must survive ledger expiry; persistent storage pays rent to stay alive |
| Geometric mean for first deposit | `√(a × b)` prevents the first depositor from manipulating the initial price to extract value |
| Checks-effects-interactions | Reserves updated before token transfers to prevent reentrancy attacks |
| Slippage parameter on swap | Protects users from front-running and price movement between simulation and execution |
| Simulate before submit | Soroban requires a simulation step to determine the resource fee and ledger footprint before a transaction can be submitted |
