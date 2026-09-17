import { expect } from "chai";
import { network } from "hardhat";

describe("Staking", function () {
  async function deployContracts() {
    const { ethers } = await network.connect();

    const [owner, alice] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("TestToken");
    const token = await Token.deploy();
    await token.waitForDeployment();

    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(
      await token.getAddress()
    );
    await staking.waitForDeployment();

    return {
      ethers,
      owner,
      alice,
      token,
      staking,
    };
  }

  it("should deploy the staking contract with the correct token", async function () {
    const { token, staking } = await deployContracts();

    expect(await staking.stakingToken()).to.equal(
      await token.getAddress()
    );
  });

  it("should allow a user to stake tokens", async function () {
    const { ethers, alice, token, staking } =
      await deployContracts();

    await token.transfer(
      alice.address,
      ethers.parseEther("1000")
    );

    await token
      .connect(alice)
      .approve(
        await staking.getAddress(),
        ethers.parseEther("100")
      );

    await staking
      .connect(alice)
      .stake(ethers.parseEther("100"));

    expect(
      await staking.stakedBalance(alice.address)
    ).to.equal(ethers.parseEther("100"));

    expect(
      await token.balanceOf(await staking.getAddress())
    ).to.equal(ethers.parseEther("100"));
  });

  it("should allow a user to withdraw staked tokens", async function () {
    const { ethers, alice, token, staking } =
      await deployContracts();

    await token.transfer(
      alice.address,
      ethers.parseEther("1000")
    );

    await token
      .connect(alice)
      .approve(
        await staking.getAddress(),
        ethers.parseEther("100")
      );

    await staking
      .connect(alice)
      .stake(ethers.parseEther("100"));

    await staking
      .connect(alice)
      .withdraw(ethers.parseEther("50"));

    expect(
      await staking.stakedBalance(alice.address)
    ).to.equal(ethers.parseEther("50"));

    expect(
      await token.balanceOf(await staking.getAddress())
    ).to.equal(ethers.parseEther("50"));
  });

  it("should reject staking zero tokens", async function () {
    const { alice, staking } = await deployContracts();

    await expect(
      staking.connect(alice).stake(0)
    ).to.be.revertedWith(
      "Amount must be greater than 0"
    );
  });

  it("should reject withdrawing more than the staked balance", async function () {
    const { ethers, alice, token, staking } =
      await deployContracts();

    await token.transfer(
      alice.address,
      ethers.parseEther("1000")
    );

    await token
      .connect(alice)
      .approve(
        await staking.getAddress(),
        ethers.parseEther("100")
      );

    await staking
      .connect(alice)
      .stake(ethers.parseEther("100"));

    await expect(
      staking
        .connect(alice)
        .withdraw(ethers.parseEther("101"))
    ).to.be.revertedWith(
      "Insufficient staked balance"
    );
  });

  it("should record the staking start time", async function () {
    const { ethers, alice, token, staking } =
      await deployContracts();

    await token.transfer(
      alice.address,
      ethers.parseEther("1000")
    );

    await token
      .connect(alice)
      .approve(
        await staking.getAddress(),
        ethers.parseEther("100")
      );

    const beforeStake =
      await ethers.provider.getBlock("latest");

    await staking
      .connect(alice)
      .stake(ethers.parseEther("100"));

    const afterStake =
      await ethers.provider.getBlock("latest");

    const startTime =
      await staking.stakingStartTime(alice.address);

    expect(Number(startTime)).to.be.at.least(
      Number(beforeStake!.timestamp)
    );

    expect(Number(startTime)).to.be.at.most(
      Number(afterStake!.timestamp)
    );
  });

  it("should calculate 10% APR reward after one year", async function () {
    const { ethers, alice, token, staking } =
      await deployContracts();

    await token.transfer(
      alice.address,
      ethers.parseEther("1000")
    );

    await token
      .connect(alice)
      .approve(
        await staking.getAddress(),
        ethers.parseEther("1000")
      );

    await staking
      .connect(alice)
      .stake(ethers.parseEther("1000"));

    await ethers.provider.send(
      "evm_increaseTime",
      [365 * 24 * 60 * 60]
    );

    await ethers.provider.send(
      "evm_mine",
      []
    );

    const reward =
      await staking.calculateReward(alice.address);

    expect(reward).to.equal(
      ethers.parseEther("100")
    );
  });

  it("should allow a user to claim their reward", async function () {
    const { ethers, owner, alice, token, staking } =
      await deployContracts();

    // Give Alice 1,000 tokens to stake
    await token.transfer(
      alice.address,
      ethers.parseEther("1000")
    );

    // Alice approves staking contract
    await token
      .connect(alice)
      .approve(
        await staking.getAddress(),
        ethers.parseEther("1000")
      );

    // Alice stakes 1,000 tokens
    await staking
      .connect(alice)
      .stake(ethers.parseEther("1000"));

    // Give the staking contract extra tokens
    // to use as reward tokens.
    await token.transfer(
      await staking.getAddress(),
      ethers.parseEther("100")
    );

    // Move forward one year
    await ethers.provider.send(
      "evm_increaseTime",
      [365 * 24 * 60 * 60]
    );

    await ethers.provider.send(
      "evm_mine",
      []
    );

    const aliceBalanceBefore =
      await token.balanceOf(alice.address);

    // Alice claims her reward
    await staking
      .connect(alice)
      .claimReward();

    const aliceBalanceAfter =
      await token.balanceOf(alice.address);

   // Alice should receive approximately 100 reward tokens
const claimedReward =
  aliceBalanceAfter - aliceBalanceBefore;

const expectedReward =
  ethers.parseEther("100");

const tolerance =
  ethers.parseEther("0.001");

expect(claimedReward).to.be.gte(
  expectedReward
);

expect(claimedReward).to.be.lte(
  expectedReward + tolerance
);

    // Alice's staked balance should still be 1,000
    expect(
      await staking.stakedBalance(alice.address)
    ).to.equal(
      ethers.parseEther("1000")
    );
  });

  it("should reset the reward timer after claiming", async function () {
    const { ethers, alice, token, staking } =
      await deployContracts();

    await token.transfer(
      alice.address,
      ethers.parseEther("1000")
    );

    await token
      .connect(alice)
      .approve(
        await staking.getAddress(),
        ethers.parseEther("1000")
      );

    await staking
      .connect(alice)
      .stake(ethers.parseEther("1000"));

    // Add reward tokens
    await token.transfer(
      await staking.getAddress(),
      ethers.parseEther("100")
    );

    // Move forward one year
    await ethers.provider.send(
      "evm_increaseTime",
      [365 * 24 * 60 * 60]
    );

    await ethers.provider.send(
      "evm_mine",
      []
    );

    // Claim reward
    await staking
      .connect(alice)
      .claimReward();

    // Immediately after claiming,
    // reward should be zero because the timer reset.
    const rewardAfterClaim =
      await staking.calculateReward(alice.address);

    expect(rewardAfterClaim).to.equal(0);
  });

  it("should reject claiming when there is no reward", async function () {
    const { alice, staking } =
    await deployContracts();

  // Alice has not staked any tokens.
  await expect(
    staking
      .connect(alice)
      .claimReward()
  ).to.be.revertedWith(
    "No reward available"
  );
});

it("should allow emergency withdrawal of staked tokens", async function () {
  const { ethers, alice, token, staking } =
    await deployContracts();

  // Give Alice 1,000 tokens
  await token.transfer(
    alice.address,
    ethers.parseEther("1000")
  );

  // Approve staking contract
  await token
    .connect(alice)
    .approve(
      await staking.getAddress(),
      ethers.parseEther("1000")
    );

  // Alice stakes 1,000 tokens
  await staking
    .connect(alice)
    .stake(
      ethers.parseEther("1000")
    );

  const balanceBefore =
    await token.balanceOf(alice.address);

  // Emergency withdrawal
  await staking
    .connect(alice)
    .emergencyWithdraw();

  const balanceAfter =
    await token.balanceOf(alice.address);

  // Alice should receive her 1,000 tokens back
  expect(
    balanceAfter - balanceBefore
  ).to.equal(
    ethers.parseEther("1000")
  );

  // Staked balance should be zero
  expect(
    await staking.stakedBalance(alice.address)
  ).to.equal(0);

  // Start time should be reset
  expect(
    await staking.stakingStartTime(alice.address)
  ).to.equal(0);
});

it("should forfeit rewards during emergency withdrawal", async function () {
  const { ethers, alice, token, staking } =
    await deployContracts();

  // Give Alice 1,000 tokens
  await token.transfer(
    alice.address,
    ethers.parseEther("1000")
  );

  // Approve staking contract
  await token
    .connect(alice)
    .approve(
      await staking.getAddress(),
      ethers.parseEther("1000")
    );

  // Alice stakes 1,000 tokens
  await staking
    .connect(alice)
    .stake(
      ethers.parseEther("1000")
    );

  // Move forward one year
  await ethers.provider.send(
    "evm_increaseTime",
    [365 * 24 * 60 * 60]
  );

  await ethers.provider.send(
    "evm_mine",
    []
  );

  // Reward should exist before emergency withdrawal
  const rewardBefore =
    await staking.calculateReward(alice.address);

  expect(rewardBefore).to.be.gt(0);

  const balanceBefore =
    await token.balanceOf(alice.address);

  // Emergency withdrawal
  await staking
    .connect(alice)
    .emergencyWithdraw();

  const balanceAfter =
    await token.balanceOf(alice.address);

  // Alice receives only her principal
  expect(
    balanceAfter - balanceBefore
  ).to.equal(
    ethers.parseEther("1000")
  );

  // No tokens remain staked
  expect(
    await staking.stakedBalance(alice.address)
  ).to.equal(0);

  // No reward can be calculated anymore
  expect(
    await staking.calculateReward(alice.address)
  ).to.equal(0);
});

it("should preserve rewards when a user stakes more tokens", async function () {
  const { ethers, alice, token, staking } =
    await deployContracts();

  // Give Alice 2,000 tokens
  await token.transfer(
    alice.address,
    ethers.parseEther("2000")
  );

  // Approve staking contract
  await token
    .connect(alice)
    .approve(
      await staking.getAddress(),
      ethers.parseEther("2000")
    );

  // Alice stakes 1,000 tokens
  await staking
    .connect(alice)
    .stake(
      ethers.parseEther("1000")
    );

  // Move forward half a year
  await ethers.provider.send(
    "evm_increaseTime",
    [182 * 24 * 60 * 60]
  );

  await ethers.provider.send(
    "evm_mine",
    []
  );

  // Alice stakes another 1,000
  await staking
    .connect(alice)
    .stake(
      ethers.parseEther("1000")
    );

  // Alice should now have 2,000 staked
  expect(
    await staking.stakedBalance(alice.address)
  ).to.equal(
    ethers.parseEther("2000")
  );

  // Previously earned reward should be preserved
  expect(
    await staking.pendingRewards(alice.address)
  ).to.be.gt(0);
});

it("should allow funding the reward pool", async function () {
  const { ethers, alice, token, staking } =
    await deployContracts();

  const rewardAmount =
    ethers.parseEther("10000");

  // Give Alice reward tokens
  await token.transfer(
    alice.address,
    rewardAmount
  );

  // Approve staking contract to use Alice's tokens
  await token
    .connect(alice)
    .approve(
      await staking.getAddress(),
      rewardAmount
    );

  // Fund the reward pool
  await staking
    .connect(alice)
    .fundRewards(
      rewardAmount
    );

  // Check staking contract received the tokens
  expect(
    await token.balanceOf(
      await staking.getAddress()
    )
  ).to.equal(
    rewardAmount
  );
});

it("should emit a Staked event when a user stakes", async function () {
  const { ethers, alice, token, staking } =
    await deployContracts();

  const stakeAmount =
    ethers.parseEther("1000");

  // Give Alice tokens
  await token.transfer(
    alice.address,
    stakeAmount
  );

  // Approve staking contract
  await token
    .connect(alice)
    .approve(
      await staking.getAddress(),
      stakeAmount
    );

  // Stake and check the event
  await expect(
    staking
      .connect(alice)
      .stake(stakeAmount)
  )
    .to.emit(staking, "Staked")
    .withArgs(
      alice.address,
      stakeAmount
    );
});

});