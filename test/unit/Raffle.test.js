const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", async function () {
          let raffle, vrfCoordinatorV2_5Mock, raffleEntranceFee, deployer, interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              // const { deployer } = await getNamedAccounts()
              // we need to acces the deployer globally in the tests
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock")
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
              // Add raffle contract as a valid consumer for the VRFCoordinator
              const subscriptionId = await raffle.i_subscriptionId() // Get subscription ID from the raffle contract
              await vrfCoordinatorV2_5Mock.addConsumer(subscriptionId, raffle.address)

              // Fund the subscription if required by the mock
              const fundAmount = ethers.utils.parseEther("10") // Fund amount as per the requirements
              await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, fundAmount)
          })

          describe("constructor", function () {
              it("initializes the raffle correctly", async function () {
                  const raffleState = await raffle.getRaffleState()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })

          describe("enterRaffle", function () {
              it("Reverts when the value sent is less than entrance fee", async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__SendMoreToEnterRaffle",
                  )
              })
              it("Records players when they enter", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })
              // Testing RaffleEnter event
              it("Emits RaffleEnter event on enterRaffle", async function () {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffle,
                      "RaffleEnter",
                  )
              })

              /// Testing Raffle doesn't allow new players to join when it is Not Open
              /*
              performUpkeep() is the only function that can change the `raffleState` to `RaffleState.CALCULATING`
              We will pretend to be the chainlink Upkeeper and keeper
              checkUpkeep() needs to return `upkeepNeeded == true` in order for
              chainlinak keeper to call `performUpkeep`.
              We need to satisfy (true) the following conditions:
              - bool isOpen = RaffleState.OPEN == s_raffleState;
              - bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
              - bool hasPlayers = (s_players.length > 0);
              - bool hasBalance = (address(this).balance > 0);
              */
              it("Doesn't allow to enter raffle when raffle is NOT open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  //Here we pretend to be a Chainlink Keeper
                  await raffle.performUpkeep([])
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      "Raffle__NotOpen",
                  )
              })
          })

          describe("checkUpkeep", function () {
              it("returns false if there are no players", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  // Instead of actually calling "raffle.checkUpKeep([])" we can simulate a transaction
                  // by using callstatic
                  //await raffle.checkUpKeep([])
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })
              // Here we want to satisfy all of the conditions except for Raffle.OPEN
              it("returns upkeepneeded false if raffle isn't open", async function () {
                  // 1. At least one player has entered the raffle
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  // enough time has passed in order to perform upkeep
                  await raffle.performUpkeep([])
                  // Now upkeepNeeded should be false
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  const raffleState = await raffle.getRaffleState()
                  // "1" corresponds to "CALCULATING"
                  assert.equal(raffleState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
              it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]) // use a higher number here if this test fails
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded)
              })
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded)
              })
          })
          describe("performUpKeep", function () {
              it("it can only run if checkupkeep is true", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const tx = await raffle.performUpkeep([])
                  assert(tx)
              })
              it("reverts with Raffle__UpKeepNotNeeded if checkupkeep is false", async function () {
                  await expect(raffle.performUpkeep([])).to.be.revertedWith(
                      "Raffle__UpKeepNotNeeded",
                  )
              })
              it("updates the raffle state, emits an event and calls the vrf coordinator", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })

                  const txResponse = await raffle.performUpkeep([])
                  const txReceipt = await txResponse.wait(1)

                  // Find the RequestedRaffleWinner event in the transaction receipt
                  const requestedRaffleWinnerEvent = txReceipt.events.find(
                      (event) => event.event === "RequestedRaffleWinner",
                  )

                  // Check that the event exists and extract the requestId
                  assert(requestedRaffleWinnerEvent, "RequestedRaffleWinner event not found")
                  const requestId = requestedRaffleWinnerEvent.args.requestId
                  const raffleState = await raffle.getRaffleState()

                  assert(requestId.toNumber() > 0)
                  assert(raffleState.toString() == "1")
              })
          })

          describe("fullfillRandomWords", function () {
              // We add another beforeEach because we will always need somebody who entered the lottery
              // and that the interval time has passed
              beforeEach(async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
              })
              it("can only be called after performUpKeep", async function () {
                  await expect(
                      vrfCoordinatorV2_5Mock.fulfillRandomWords(0, raffle.address),
                  ).to.be.revertedWith("InvalidRequest")
                  await expect(
                      vrfCoordinatorV2_5Mock.fulfillRandomWords(1, raffle.address),
                  ).to.be.revertedWith("InvalidRequest")
              })
          })
      })
