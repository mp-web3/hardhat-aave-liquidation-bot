const { network, ethers } = require("hardhat")
const { ChainId, UiIncentiveDataProvider, UiPoolDataProvider } = require("@aave/contract-helpers")
const markets = require("@bgd-labs/aave-address-book")
require("dotenv").config()

const provider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL)

// User address to fetch data for, insert address here
const currentAccount = "0x4b1796a1D7218d7F4DF2946348498BB42cBEA597"

// View contract used to fetch all reserves data (including market base currency data), and user reserves
// Using Aave V3 Eth Mainnet address for demo
const poolDataProviderContract = new UiPoolDataProvider({
    uiPoolDataProviderAddress: markets.AaveV3Arbitrum.UI_POOL_DATA_PROVIDER,
    provider,
    chainId: ChainId.arbitrum_one,
})

// View contract used to fetch all reserve incentives (APRs), and user incentives
// Using Aave V3 Eth Mainnet address for demo
const incentiveDataProviderContract = new UiIncentiveDataProvider({
    uiIncentiveDataProviderAddress: markets.AaveV3Arbitrum.UI_INCENTIVE_DATA_PROVIDER,
    provider,
    chainId: ChainId.arbitrum_one,
})

async function fetchContractData() {
    // Object containing array of pool reserves and market base currency data
    // { reservesArray, baseCurrencyData }
    const reserves = await poolDataProviderContract.getReservesHumanized({
        lendingPoolAddressProvider: markets.AaveV3Arbitrum.POOL_ADDRESSES_PROVIDER,
    })

    // Object containing array or users aave positions and active eMode category
    // { userReserves, userEmodeCategoryId }
    const userReserves = await poolDataProviderContract.getUserReservesHumanized({
        lendingPoolAddressProvider: markets.AaveV3Arbitrum.POOL_ADDRESSES_PROVIDER,
        user: currentAccount,
    })

    // Array of incentive tokens with price feed and emission APR
    const reserveIncentives =
        await incentiveDataProviderContract.getReservesIncentivesDataHumanized({
            lendingPoolAddressProvider: markets.AaveV3Arbitrum.POOL_ADDRESSES_PROVIDER,
        })

    // Dictionary of claimable user incentives
    const userIncentives =
        await incentiveDataProviderContract.getUserReservesIncentivesDataHumanized({
            lendingPoolAddressProvider: markets.AaveV3Arbitrum.POOL_ADDRESSES_PROVIDER,
            user: currentAccount,
        })

    console.log({ reserves, userReserves, reserveIncentives, userIncentives })
}

fetchContractData()
