const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains, testnetChains } = require("../helper-hardhat-config")
// const { verify } = require("../utils/verify")
require("dotenv").config

module.exports = async function (hre) {
    const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const deployer = (await getNamedAccounts()).deployer

    let entranceFee = ethers.utils.parseEther("0.01")
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: [entranceFee],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // if (developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    //     await verify(raffle.address)
    // }
}
