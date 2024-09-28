const { developmentChains, testnetChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()


module.exports = async (hre) => {
    const { getNamedAccounts, deployments, ethers, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2_5Address, subscriptionId, vrfCoordinatorV2_5Mock
    
    if (developmentChains.includes(network.name)) {
        log("Getting VRFCoordinatorV2_5 deployment")
        vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock")
        vrfCoordinatorV2_5Address = vrfCoordinatorV2_5Mock.address
        // Here we create a new subscription for local development/testing purposes
        const transactionResponse = await vrfCoordinatorV2_5Mock.createSubscription() // the function is inherited from SubscriptionAPI.sol
        const transactionReceipt = await transactionResponse.wait(1)
        const VRF_SUB_FUND_AMOUNT_HH = ethers.utils.parseEther("10")
        // createSubscription() emits an event `emit SubscriptionCreated(subId, msg.sender);`
        // We can therefore reecover the subscriptionId from the receipt
        subscriptionId = transactionReceipt.events[0].args.subId
        // Now we need to fund the subscription
        // In the Mock version we can fund the subscription without tokens
        await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT_HH)
    } else {
        vrfCoordinatorV2_5Address = networkConfig[chainId]["vrfCoordinatorV2_5"]
        // For Sepolia Testnet we need a real subscription ID
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }
    
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"] //100 gwei Key Hash https://docs.chain.link/vrf/v2-5/supported-networks#sepolia-testnet
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    
    const args = [
        vrfCoordinatorV2_5Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (testnetChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(raffle.address)
        log("-------------------------------------------")
    }

}

module.exports.tags = ["all", "raffle"]