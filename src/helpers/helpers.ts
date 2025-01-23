import ethers from 'ethers';
import IDragonswapV2Factory from '../../src/abi/IDragonswapV2Factory.json';
import IDragonswapV2Pool from '../../src/abi/IDragonswapV2Pool.json';
import { Pool, Position, nearestUsableTick } from 'v2-sdk/sdks/v2-sdk/src/';
import { Token } from 'v2-sdk/sdks/v2-sdk/src/core';
import { AddLiquidityParams, PoolData, PoolInfo } from '../interfaces/AddLiquidityParams';




export class Helpers {
    private factoryContract: ethers.Contract;
    private readonly signer: ethers.Signer;


    private readonly DRAGONSWAP_FACTORY_ADDRESS: string = "0x7431A23897ecA6913D5c81666345D39F27d946A4";

    constructor(signer: ethers.Signer) {
        this.signer = signer;
        this.factoryContract = new ethers.Contract(
            this.DRAGONSWAP_FACTORY_ADDRESS,
            IDragonswapV2Factory.abi,
            this.signer
        );
    };

    public createToken = (chainId: number, address: string, decimals: number, symbol: string, name: string) => {
        return new Token(chainId, address, decimals, symbol, name);
    }

    public getPoolInfo = async (tokenIn: string, tokenOut: string): Promise<PoolInfo> => {
        const feeTiers: number[] = [100, 200, 500, 2000, 5000, 10000];

        for (const fee of feeTiers) {
            const poolAddress = await this.factoryContract.getPool(tokenIn, tokenOut, fee);

            if (poolAddress !== ethers.ZeroAddress) {
                console.log(`Valid pool found for ${tokenIn}-${tokenOut} with fee: ${fee}`);
                return {
                    poolAddress: poolAddress,
                    poolFee: fee
                };
            }

        }

        throw new Error(`No valid pool found for tokens ${tokenIn} and ${tokenOut}`);
    }

    public getPosition = async (token0: Token, token1: Token, poolData: PoolData): Promise<any> => {

        const pool = new Pool(
            token0,
            token1,
            poolData.fee,
            poolData.sqrtPriceX96.toString(),
            poolData.liquidity.toString(),
            poolData.tick
        );

        return new Position({
            pool: pool,
            liquidity: poolData.liquidity.toString(),
            tickLower: nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2,
            tickUpper: nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2,
        });

    }

    public getPoolData = async (poolAddress: string): Promise<PoolData> => {

        try {

            const poolContract = new ethers.Contract(
                poolAddress,
                IDragonswapV2Pool.abi,
                this.signer
            );

            const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
                poolContract.tickSpacing(),
                poolContract.fee(),
                poolContract.liquidity(),
                poolContract.slot0()
            ]);

            return {
                tickSpacing: tickSpacing,
                fee: fee,
                liquidity: liquidity,
                sqrtPriceX96: slot0[0],
                tick: slot0[1],
            };

        } catch (error) {
            console.error('Error fetching pool data:', error);
            throw error;
        }

    }

    public getAddLiquidityParams = (
        token0: Token,
        token1: Token,
        fee: number,
        tickLower: number,
        tickUpper: number,
        amount0Desired: number,
        amount1Desired: number,
        amount0Min: number,
        amount1Min: number,
        recipient: string,
        deadline: number
    ) => {
        return {
            token0: token0,
            token1: token1,
            fee: fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: amount0Min,
            amount1Min: amount1Min,
            recipient: recipient,
            deadline: deadline
        };
    }
}
