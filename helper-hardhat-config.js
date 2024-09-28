const { ethers } = require("hardhat")

const networkConfig = {
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.001"),
        gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        callbackGasLimit: "500000",
        interval: "30",
    },
    11155111: {
        name: "sepolia",
        vrfCoordinatorV2_5: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
        entranceFee: ethers.utils.parseEther("0.001"),
        gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", //100 gwei Key Hash https://docs.chain.link/vrf/v2-5/supported-networks#sepolia-testnet
        subscriptionId:
            "90569123908525426660678444862203092261233996602769345559829783855360620620922",
        callbackGasLimit: "500000",
        interval: "30",
    },
}

// Supported Networks
// https://docs.chain.link/vrf/v2-5/supported-networks

const developmentChains = ["hardhat", "localhost"]
const testnetChains = ["sepolia"]

module.exports = {
    networkConfig,
    developmentChains,
    testnetChains
}
