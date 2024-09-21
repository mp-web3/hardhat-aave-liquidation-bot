const networkConfig = {
    31337: {
        name: "localhost",
    },
    11155111: {
        name: "sepolia",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    },

    17000: {
        name: "holesky",
        ethUsdPriceFeed: "0xF1d8fF462BA892F25CeF92351F572288610D17e5",
        fundMeAddress: "0x3400FBa68FC15ac9BEf1Dc7Dff7FD884eC3Adb3F",
    },
}

const developmentChains = ["hardhat", "localhost"]
const testnetChains = ["holesky"]

module.exports = {
    networkConfig,
    developmentChains,
    testnetChains,
}
