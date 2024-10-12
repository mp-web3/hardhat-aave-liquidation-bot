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
      })
