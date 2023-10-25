import { BigNumber } from "ethers";
import { Decimal } from "decimal.js";
// Arbitrum addresses
export const UNISWAP_QUOTERV2_ADDRESS =
  "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";
export const UNISWAP_FACTORY_ADDRESS =
  "0x1F98431c8aD98523631AE4a59f267346ea31F984";
export const POOL_INIT_CODE_HASH =
  "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";

// euler contracts not deployed in Arbitrum
export const EULER_VIEW_ADDRESS = "0x0000000000000000000000000000000000000000";
export const EULER_CONTRACT_ADDRESS =
  "0x0000000000000000000000000000000000000000";

export const USDC_ADDRESS = "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8";
export const WETH_ADDRESS = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
export const MAX_TICK_PRICE = Decimal.pow(1.0001, 887272);
export const MIN_TICK_PRICE = Decimal.pow(1.0001, -887272);
export const c1e18 = BigNumber.from(10).pow(18);
export const QUOTER_ABI = [
  "function quoteExactInputSingle(tuple(address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96) params) public returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
];
export const UNISWAP_V3_POOL_ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
];
export const UNISWAP_V3_FACTORY_ABI = [
  "function getPool(address token0, address token1, uint24 fee) public view returns (address)",
];
export const TICK_SPACINGS = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
};

export const TOKEN_LIST = [
  {
    chainId: 1,
    address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
  },
  {
    chainId: 1,
    address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
  },
  {
    chainId: 1,
    address: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
  },
  {
    chainId: 1,
    address: "0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a",
    name: "GMX",
    symbol: "GMX",
    decimals: 18,
  },
  {
    chainId: 1,
    address: "0x0c880f6761f1af8d9aa9c466984b80dab9a8c9e8",
    name: "Pendle",
    symbol: "PENDLE",
    decimals: 18,
  },
  {
    chainId: 1,
    address: "0x912ce59144191c1204e64559fe8253a0e49e6548",
    name: "ARB",
    symbol: "ARB",
    decimals: 18,
  },
  {
    chainId: 1,
    address: "0x3082cc23568ea640225c2467653db90e9250aaa0",
    name: "RDNT",
    symbol: "RDNT",
    decimals: 18,
  },
];
