require("dotenv").config()
require("@nomiclabs/hardhat-waffle")
require("@nomicfoundation/hardhat-verify")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")
require("hardhat-contract-sizer")

const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const HOLESKY_RPC_URL = process.env.HOLESKY_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        localhost: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        arbitrum: {
            url: ARBITRUM_RPC_URL,
            // provider: new ethers.providers.JsonRpcProvider(ARBITRUM_RPC_URL),
            accounts: [PRIVATE_KEY],
            chainId: 42161,
            blockConfirmations: 1,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    etherscan: {
        apiKey: {
            sepolia: ETHERSCAN_API_KEY,
            holesky: ETHERSCAN_API_KEY,
        },
        customChains: [
            {
                network: "sepolia",
                chainId: 11155111,
                urls: {
                    apiURL: "https://api-sepolia.etherscan.io/api",
                    browserURL: "https://sepolia.etherscan.io",
                },
            },
            {
                network: "holesky",
                chainId: 17000,
                urls: {
                    apiURL: "https://api-holesky.etherscan.io/api",
                    browserURL: "https://holesky.etherscan.io/",
                },
            },
        ],
    },
    sourcify: {
        enabled: false,
    },
    gasReporter: {
        enabled: false,
        noColors: true,
        outputFile: "./reports/gas-report.txt",
        currency: "USD",
        // coinmarketcap: COINMARKETCAP_API_KEY,
        // L1: "ethereum",
        token: "ETH",
        // L1Etherscan: ETHERSCAN_API_KEY,
    },
    solidity: {
        compilers: [
            {
                version: "0.8.19",
            },
            {
                version: "0.8.8",
            },
        ],
    },
    // This timeout will resolve the promise
    mocha: {
        timeout: 200000, // 200 seconds
    },
}
