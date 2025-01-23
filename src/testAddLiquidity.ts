import { LiquidityManager } from "./addLiquidity";
import { ethers } from 'ethers'
import { AddLiquidityParams, PoolData, PoolInfo } from "./interfaces/AddLiquidityParams";
import { Helpers } from "./helpers/helpers";
import { nearestUsableTick } from "v2-sdk/sdks/v2-sdk/src";
import { Token } from "v2-sdk/sdks/v2-sdk/src/core";

async function main() {

    const privateKey: string = "private key";
    const rpcUrl: string = "https://kaia.blockpi.network/v1/rpc/public";
    const walletAddress: string = "wallet address";

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const signer = wallet.connect(provider);

    const helpers = new Helpers(signer);

    const token0: Token = helpers.createToken(1001, "", 18, "KAIA", "KAIA");
    const token1: Token = helpers.createToken(1001, "", 18, "KAIA", "KAIA");

    const poolInfo: PoolInfo = await helpers.getPoolInfo(token0.address, token1.address);
    const poolData: PoolData = await helpers.getPoolData(poolInfo.poolAddress);

    const position = await helpers.getPosition(token0, token1, poolData);
    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts

    const tickLower: number = nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2;
    const tickUpper: number = nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2;
    const deadline = Math.floor(Date.now() / 1000) + 600;

    const param: AddLiquidityParams = this.helpers.getAddLiquidityParams(token0, token1, poolInfo.poolFee, tickLower, tickUpper, amount0Desired, amount1Desired, amount0Desired, amount1Desired, signer, deadline);

    console.log("Initializing.......");

    const liquidityManager = new LiquidityManager(signer);

    await liquidityManager.addLiquidity(param).catch(console.error);

    console.log("Swap process completed.");
}

main().catch((error) => {
    console.error("Error executing the swap:", error);
});
