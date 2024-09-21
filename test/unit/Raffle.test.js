const { deployments, ethers, network, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")
const { describe } = require("node:test")

describe("Raffle", function () {
    let deployer, signers, account1, raffle, entranceFee, sendValue

    beforeEach(async function () {
        signers = await ethers.getSigners()
        deployer = signers[0]
        account1 = signers[1]

        entranceFee = ethers.utils.parseEther("0.01")

        const raffleFactory = await ethers.getContractFactory("Raffle", deployer)
        raffle = await raffleFactory.deploy(entranceFee)
        await raffle.deployed()
    })

    describe("constructor", function () {
        it("Sets the entranceFee correctly", async function () {
            const response = await raffle.getEntranceFee()
            assert.equal(entranceFee.toString(), response.toString())
        })
    })

    describe("enterRaffle function", function () {
        it("Reverts if value sent is less than entranceFee", async function () {
            sendValue = ethers.utils.parseEther("0.009999999")
            await expect(raffle.enterRaffle({ value: sendValue })).to.be.revertedWith(
                "Raffle_NotEnoughEth()",
            )
        })

        it("Update the players array, once a player enter the raffle", async function () {
            sendValue = ethers.utils.parseEther("0.01")
            const connectedRaffle = await raffle.connect(account1)
            const transactionResponse = await connectedRaffle.enterRaffle({ value: sendValue })
            const transactionReceipt = await transactionResponse.wait(1)

            const player0 = await connectedRaffle.getPlayer(0)

            assert.equal(player0.toLowerCase(), account1.address.toLowerCase())
        })
    })
})
