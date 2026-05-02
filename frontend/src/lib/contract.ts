// TODO: implement Soroban contract interaction using @stellar/stellar-sdk
// Flow: simulate → assemble → Freighter sign → submit → poll

// TODO: implement swap invocation
export async function swap(
  _callerAddress: string,
  _tokenIn: string,
  _amountIn: bigint,
  _minAmountOut: bigint,
): Promise<bigint> {
  throw new Error("not implemented");
}

// TODO: implement deposit invocation
export async function deposit(
  _callerAddress: string,
  _amountA: bigint,
  _amountB: bigint,
): Promise<bigint> {
  throw new Error("not implemented");
}

// TODO: implement withdraw invocation
export async function withdraw(
  _callerAddress: string,
  _shares: bigint,
): Promise<[bigint, bigint]> {
  throw new Error("not implemented");
}

// TODO: read-only quote via simulateTransaction
export async function getAmountOut(
  _tokenIn: string,
  _amountIn: bigint,
): Promise<bigint> {
  return 0n;
}

// TODO: read pool reserves via simulateTransaction
export async function getReserves(): Promise<[bigint, bigint]> {
  return [0n, 0n];
}
