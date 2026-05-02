#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum DataKey {
    TokenA,
    TokenB,
    ReserveA,
    ReserveB,
    TotalShares,
    Shares(Address),
}

#[contract]
pub struct LiquidityPool;

#[contractimpl]
impl LiquidityPool {
    /// Initialize the pool with two token addresses.
    pub fn initialize(env: Env, token_a: Address, token_b: Address) {
        if env.storage().instance().has(&DataKey::TokenA) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::TokenA, &token_a);
        env.storage().instance().set(&DataKey::TokenB, &token_b);
        env.storage().instance().set(&DataKey::ReserveA, &0_i128);
        env.storage().instance().set(&DataKey::ReserveB, &0_i128);
        env.storage().instance().set(&DataKey::TotalShares, &0_i128);
    }

    /// TODO: implement constant-product deposit (x * y = k)
    pub fn deposit(_env: Env, _from: Address, _amount_a: i128, _amount_b: i128) -> i128 {
        panic!("not implemented")
    }

    /// TODO: implement LP share withdrawal
    pub fn withdraw(_env: Env, _from: Address, _shares: i128) -> (i128, i128) {
        panic!("not implemented")
    }

    /// TODO: implement swap with 0.3% fee and slippage guard
    pub fn swap(
        _env: Env,
        _from: Address,
        _token_in: Address,
        _amount_in: i128,
        _min_amount_out: i128,
    ) -> i128 {
        panic!("not implemented")
    }

    pub fn get_reserves(env: Env) -> (i128, i128) {
        let a: i128 = env.storage().instance().get(&DataKey::ReserveA).unwrap_or(0);
        let b: i128 = env.storage().instance().get(&DataKey::ReserveB).unwrap_or(0);
        (a, b)
    }
}
