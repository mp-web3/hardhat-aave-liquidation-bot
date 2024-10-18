require("dotenv").config()
const fs = require("fs")
const path = require("path")

// __dirname is a Node.js global variable that holds the absolute path
// to the directory containing the current script file
const FRONTEND_ADDRESSES_FILE = path.resolve(
    __dirname,
    "../../nextjs-smartcontract-lottery/constants/contractAddresses.json",
)
const FRONTEND_ABI_FILE = path.resolve(
    __dirname,
    "../../nextjs-smartcontract-lottery/constants/abi.json",
)

function fileExists(path) {
    try {
        fs.accessSync(path, fs.constants.F_OK)
        return true
    } catch (err) {
        return false
    }
}

// This script will update the constans folder inside nextjs-smartcontract-lottery
// in order to have everything we need in our frontend to interact with the deployed contracts
// It will update frontend only when the variable in env file `UPDATE_FRONTED=true`
module.exports = async (hre) => {
    const { ethers, network } = hre
    if (process.env.UPDATE_FRONTEND) {
        console.log("Updating frontend...")
        updateContractAddresses()
        updateAbi()
    }

    async function updateContractAddresses() {
        const raffle = await ethers.getContract("Raffle")
        const chainId = network.config.chainId.toString()
        // Check if the contractAddresses file exists
        if (!fileExists(FRONTEND_ADDRESSES_FILE)) {
            console.log(`File ${FRONTEND_ADDRESSES_FILE} not found, creating it.`)
            fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify({}))
        }
        // contractAddresses is parsed from a JSON file into a JavaScript object.
        // This object contains a mapping of chain IDs(as keys) to contract addresses(as values).
        const contractAddresses = JSON.parse(fs.readFileSync(FRONTEND_ADDRESSES_FILE, "utf-8"))
        // Check if the current network's chainId exists in contractAddresses
        if (chainId in contractAddresses) {
            // If the raffle address is not already stored for this chainId, add it
            if (!contractAddresses[chainId].includes(raffle.address)) {
                contractAddresses.push(raffle.address)
            }
        } else {
            // If the chainId doesn't exist, create a new array with the raffle address
            contractAddresses[chainId] = [raffle.address]
        }
        fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(contractAddresses))
    }

    async function updateAbi() {
        const raffle = await ethers.getContract("Raffle")

        // Check if the abi file exists
        if (!fileExists(FRONTEND_ABI_FILE)) {
            console.log(`File ${FRONTEND_ABI_FILE} not found, creating it.`)
        }
        // https://docs.ethers.org/v5/api/utils/abi/interface/
        fs.writeFileSync(FRONTEND_ABI_FILE, raffle.interface.format(ethers.utils.FormatTypes.json))
    }
}

module.exports.tags = ["all", "frontend"]
