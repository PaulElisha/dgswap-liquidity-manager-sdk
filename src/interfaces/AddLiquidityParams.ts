import { Token } from 'v2-sdk/sdks/v2-sdk/src/core';

export interface AddLiquidityParams {
    token0: Token;  // TOKEN0
    token1: Token;  // TOKEN1
    fee: number;
    tickLower: number;
    tickUpper: number;
    amount0Desired: number;
    amount1Desired: number;
    amount0Min: number;
    amount1Min: number;
    recipient: string;
    deadline: number;
};

export interface PoolData {
    tickSpacing: number;
    fee: number;
    liquidity: BigInt;
    sqrtPriceX96: number;
    tick: number;
}

export interface PoolInfo {
    poolAddress: string;
    poolFee: number;
}