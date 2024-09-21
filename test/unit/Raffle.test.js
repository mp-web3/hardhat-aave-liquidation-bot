const { deployments, ethers, network, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

describe("Raffle", function () {
    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer

        console.log(`Deployer address ${deployer}`)
    })
})
