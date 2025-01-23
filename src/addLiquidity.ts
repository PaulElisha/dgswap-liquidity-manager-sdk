import { ethers } from 'ethers';
import { nearestUsableTick } from 'v2-sdk/sdks/v2-sdk/src/';
import INonfungiblePositionManager from '../src/abi/INonfungiblePositionManager.json';
import IDragonswapV2Factory from '../src/abi/IDragonswapV2Factory.json';
import IERC20 from '../src/abi/IERC20.json';
import { AddLiquidityParams, PoolData, PoolInfo } from './interfaces/AddLiquidityParams';
import { Helpers } from './helpers/helpers';



export class LiquidityManager {

    private readonly signer: ethers.Signer;

    public factoryContract: ethers.Contract;
    public positionManagerContract: ethers.Contract;
    public helpers: Helpers;

    private readonly DRAGONSWAP_FACTORY_ADDRESS: string = "0x7431A23897ecA6913D5c81666345D39F27d946A4";
    private readonly DRAGONSWAP_POSITION_MANAGER: string = "0x68f762d28CebaD501c090949e4680697e56848fC"; // NonfungiblePositionManager

    constructor(signer: ethers.Signer) {
        this.signer = signer;
        this.factoryContract = new ethers.Contract(
            this.DRAGONSWAP_FACTORY_ADDRESS,
            IDragonswapV2Factory.abi,
            this.signer
        );
        this.helpers = new Helpers(this.signer);

        this.positionManagerContract = new ethers.Contract(
            this.DRAGONSWAP_POSITION_MANAGER,
            INonfungiblePositionManager.abi,
            this.signer
        );
    }

    public approvalForPositionManager = async (tokenAddress: string, amount: number): Promise<void> => {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, IERC20.abi, this.signer);
            const approvalTx = await tokenContract.approve(this.DRAGONSWAP_POSITION_MANAGER, amount);
            console.log(`Approval transaction sent: ${approvalTx.hash} for ${amount}`);
            await approvalTx.wait();
            console.log(`Approval confirmed: ${approvalTx.hash} for ${amount}`);
        } catch (error) {
            console.error(`Approval failed for token ${tokenAddress}:`, error);
        }
    }

    public addLiquidity = async (_addLiquidityParams: AddLiquidityParams): Promise<any> => {
        const poolInfo: PoolInfo = await this.helpers.getPoolInfo(
            _addLiquidityParams.token0.address,
            _addLiquidityParams.token1.address
        );

        const poolData: PoolData = await this.helpers.getPoolData(
            poolInfo.poolAddress
        );

        await this.approvalForPositionManager(_addLiquidityParams.token0.address, _addLiquidityParams.amount0Desired);
        await this.approvalForPositionManager(_addLiquidityParams.token1.address, _addLiquidityParams.amount1Desired);

        _addLiquidityParams.tickLower = nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2;
        _addLiquidityParams.tickUpper = nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2;

        try {

            const tx = await this.positionManagerContract.mint(_addLiquidityParams, { gasLimit: ethers.hexlify("1000000") });
            console.log(`Liquidity added successfully. Transaction: ${tx.hash}`);
            await tx.wait();
        } catch (error) {
            console.error('Error adding liquidity:', error);
        }
    }

}