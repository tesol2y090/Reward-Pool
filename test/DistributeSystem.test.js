const { ethers, upgrades } = require("hardhat")
const { solidity } = require("ethereum-waffle")
const BigNumber = require("bignumber.js")
const chai = require("chai")
const { expect } = require("chai")

chai.use(solidity)

describe("Reward Pool", function () {
  beforeEach(async () => {
    ;[deployer, alice, bob, dev, fee] = await ethers.getSigners()
    const Lv1x = await ethers.getContractFactory("MockERC20")
    const Lv2x = await ethers.getContractFactory("MockERC20")
    const Lv3x = await ethers.getContractFactory("MockERC20")
    const Dai = await ethers.getContractFactory("MockERC20")
    const DistributeSystem = await ethers.getContractFactory("DistributeSystem")

    lv1x = await Lv1x.deploy(`Lv1x`, `Lv1x`, ethers.utils.parseEther("1000000"))
    lv2x = await Lv2x.deploy(
      `Lv2x`,
      `Lv2x`,
      ethers.utils.parseEther("1000000")
    )
    lv3x = await Lv3x.deploy(`Lv3x`, `Lv3x`, ethers.utils.parseEther("1000000"))
    dai = await Dai.deploy(`DAI`, `DAI`, ethers.utils.parseEther("1000000"))
    disSystem = await DistributeSystem.deploy()

    await lv1x.deployed()
    await lv2x.deployed()
    await lv3x.deployed()
    await dai.deployed()
    await disSystem.deployed()

    lv1xAsDeployer = lv1x.connect(deployer)
    lv1xAsAlice = lv1x.connect(alice)
    lv1xAsBob = lv1x.connect(bob)
    lv1xAsDev = lv1x.connect(dev)

    lv2xAsDeployer = lv2x.connect(deployer)
    lv2xAsAlice = lv2x.connect(alice)
    lv2xAsBob = lv2x.connect(bob)
    lv2xAsDev = lv2x.connect(dev)

    lv3xAsDeployer = lv3x.connect(deployer)
    lv3xAsAlice = lv3x.connect(alice)
    lv3xAsBob = lv3x.connect(bob)
    lv3xAsDev = lv3x.connect(dev)

    daiAsDeployer = dai.connect(deployer)
    daiAsAlice = dai.connect(alice)
    daiAsBob = dai.connect(bob)
    daiAsDev = dai.connect(dev)

    disSystemDeployer = disSystem.connect(deployer)
    disSystemAsAlice = disSystem.connect(alice)
    disSystemAsBob = disSystem.connect(bob)
    disSystemAsDev = disSystem.connect(dev)

    let instanceToApprovePool = [
      lv1xAsAlice,
      lv1xAsBob,
      lv2xAsAlice,
      lv2xAsBob,
      lv3xAsAlice,
      lv3xAsBob,
      daiAsAlice,
      daiAsBob,
    ]

    for (let i = 0; i < instanceToApprovePool.length; i++) {
      instanceToApprovePool[i].approve(
        disSystem.address,
        ethers.constants.MaxUint256
      )
    }

    lv1xAsDeployer.transfer(
      await alice.getAddress(),
      ethers.utils.parseEther("1000")
    )

    lv1xAsDeployer.transfer(
      await bob.getAddress(),
      ethers.utils.parseEther("1000")
    )

    lv2xAsDeployer.transfer(
      await alice.getAddress(),
      ethers.utils.parseEther("1000")
    )

    lv2xAsDeployer.transfer(
      await bob.getAddress(),
      ethers.utils.parseEther("1000")
    )
  })

  context("when staked pool", async () => {
    // beforeEach(async () => { })
    it("should work with 100% share of pool", async () => {
      // Initialize reward pool
      await disSystemDeployer.initialize(
        lv1x.address,
        lv3x.address,
        ethers.utils.parseEther("10"),
        20,
        30,
        ethers.utils.parseEther("10"),
        deployer.address
      )

      // Add lv3x reward to pool with 1000 lv3x
      await lv3xAsDeployer.transfer(
        disSystem.address,
        ethers.utils.parseEther("1000")
      )
      await disSystemAsAlice.deposit(ethers.utils.parseEther("1"))

      // Make block mined 3
      for (let i = 0; i < 3; i++) {
        await lv3xAsDeployer.transfer(
          await deployer.getAddress(),
          ethers.utils.parseEther("1")
        )
      }

      // 10 reward token * 3 block = 30 lv3x
      expect(await disSystem.pendingReward(await alice.getAddress())).to.be.eq(
        ethers.utils.parseEther("30")
      )

      // Make block mined 10
      for (let i = 0; i < 10; i++) {
        await lv3xAsDeployer.transfer(
          await deployer.getAddress(),
          ethers.utils.parseEther("1")
        )
      }

      expect(await disSystem.pendingReward(await alice.getAddress())).to.be.eq(
        ethers.utils.parseEther("100")
      )
      await disSystemAsAlice.withdraw(ethers.utils.parseEther("1"))
      expect(await lv3x.balanceOf(await alice.getAddress())).to.be.eq(
        ethers.utils.parseEther("100")
      )
    })
  })
})
