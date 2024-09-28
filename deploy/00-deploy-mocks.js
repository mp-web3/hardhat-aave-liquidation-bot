const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

// Since LINK has 18 decimals like ETH we could also use ethers.utils.parseEther("0.1")
const BASE_FEE = "100000000000000000" // = 0.1 LINK
// Chainlink nodes pay the gas fees to give us randomness & executing
const GAS_PRICE = "1000000000"
const WEI_PER_UNIT_LINK = "4750454356114626"

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE, WEI_PER_UNIT_LINK]

    if (developmentChains.includes(network.name)) {
        console.log("Local network detected! Deploying mocks...")
        await deploy("VRFCoordinatorV2_5Mock", {
            from: deployer,
            log: true,
            // Check standard argument/parameters values to deploy mock
            // https://docs.chain.link/vrf/v2-5/subscription/test-locally#deploy-vrfcoordinatorv2_5mock
            args: [args],
        })
        log("Mocks Deployed!")
        log("-------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
