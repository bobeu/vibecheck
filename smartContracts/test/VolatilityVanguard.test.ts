import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { parseEther, zeroAddress, getAddress } from "viem";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

// Extend chai with chai-as-promised
chaiAsPromised.transferPromiseness = (assertion: any, promise: any) => {
  assertion.then = promise.then.bind(promise);
  assertion.catch = promise.catch.bind(promise);
};

// Type assertion for hre.viem
const getViem = () => (hre as any).viem;

describe("VolatilityVanguard", function () {
  let volatilityVanguard: any;
  let cUSD: any; // Mock cUSD token
  let owner: any;
  let oracle: any;
  let feeReceiver: any;
  let user1: any;
  let user2: any;
  let user3: any;
  
  const FEE_RATE = 250n; // 2.50% in basis points (250/10000)
  const RISK_THRESHOLD = 150n; // 1.5% in basis points
  const LOCK_TIME = 7 * 24 * 60 * 60; // 7 days in seconds (as number)
  const MIN_STAKE = parseEther("0.01"); // Minimum stake amount

  beforeEach(async function () {
    // Get signers
    const viem = getViem();
    [owner, oracle, feeReceiver, user1, user2, user3] = await viem.getWalletClients();
    
    // Deploy MockERC20 as cUSD
    cUSD = await viem.deployContract("MockERC20", [
      "Celo Dollar",
      "cUSD",
      18
    ]);
    
    // Deploy VolatilityVanguard with cUSD address
    volatilityVanguard = await viem.deployContract("VolatilityVanguard", [
      cUSD.address,
      oracle.account.address,
      feeReceiver.account.address,
      FEE_RATE,
      RISK_THRESHOLD,
      LOCK_TIME
    ]);
    
    // Mint cUSD to users for testing
    const fundAmount = parseEther("1000");
    await cUSD.write.mint([user1.account.address, fundAmount]);
    await cUSD.write.mint([user2.account.address, fundAmount]);
    await cUSD.write.mint([user3.account.address, fundAmount]);
    await cUSD.write.mint([feeReceiver.account.address, fundAmount]);
  });

  describe("Deployment", function () {
    it("Should set the correct cUSD address", async function () {
      const cUSDAddr = await volatilityVanguard.read.cUSD();
      expect(cUSDAddr.toLowerCase()).to.equal(cUSD.address.toLowerCase());
    });

    it("Should set the correct oracle address", async function () {
      const oracleAddr = await volatilityVanguard.read.oracleAddress();
      expect(oracleAddr.toLowerCase()).to.equal(oracle.account.address.toLowerCase());
    });

    it("Should set the correct fee receiver", async function () {
      const feeRec = await volatilityVanguard.read.feeReceiver();
      expect(feeRec.toLowerCase()).to.equal(feeReceiver.account.address.toLowerCase());
    });

    it("Should set the correct fee rate", async function () {
      const fee = await volatilityVanguard.read.feeRate();
      expect(fee).to.equal(FEE_RATE);
    });

    it("Should set the correct risk threshold", async function () {
      const threshold = await volatilityVanguard.read.riskThreshold();
      expect(threshold).to.equal(RISK_THRESHOLD);
    });

    it("Should set the correct lock time", async function () {
      const lock = await volatilityVanguard.read.lockTime();
      expect(lock).to.equal(BigInt(LOCK_TIME));
    });

    it("Should initialize with currentRoundId = 0", async function () {
      const roundId = await volatilityVanguard.read.currentRoundId();
      expect(roundId).to.equal(0n);
    });

    it("Should revert with invalid constructor parameters", async function () {
      await expect(
        getViem().deployContract("VolatilityVanguard", [
          zeroAddress, // Invalid cUSD address
          oracle.account.address,
          feeReceiver.account.address,
          FEE_RATE,
          RISK_THRESHOLD,
          LOCK_TIME
        ])
      ).to.be.rejected;
      
      await expect(
        getViem().deployContract("VolatilityVanguard", [
          cUSD.address,
          zeroAddress, // Invalid oracle address
          feeReceiver.account.address,
          FEE_RATE,
          RISK_THRESHOLD,
          LOCK_TIME
        ])
      ).to.be.rejected;
      
      await expect(
        getViem().deployContract("VolatilityVanguard", [
          cUSD.address,
          oracle.account.address,
          zeroAddress, // Invalid fee receiver
          FEE_RATE,
          RISK_THRESHOLD,
          LOCK_TIME
        ])
      ).to.be.rejected;
      
      await expect(
        getViem().deployContract("VolatilityVanguard", [
          cUSD.address,
          oracle.account.address,
          feeReceiver.account.address,
          10001n, // > 100%
          RISK_THRESHOLD,
          LOCK_TIME
        ])
      ).to.be.rejected;
    });
  });

  describe("Round Management", function () {
    it("Should start a new round successfully", async function () {
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      const roundId = await volatilityVanguard.read.currentRoundId();
      expect(roundId).to.equal(1n);
      
      const roundInfo = await volatilityVanguard.read.getRoundInfo([1n]);
      expect(roundInfo[0]).to.equal(1n); // id
      expect(roundInfo[5]).to.equal(0n); // totalPool
      expect(roundInfo[8]).to.equal(0); // result (Pending)
      expect(Boolean(roundInfo[4])).to.equal(false); // isSettled
    });

    it("Should emit RoundStarted event", async function () {
      const viem = getViem();
      const publicClient = await viem.getPublicClient();
      const tx = await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      const logs = await publicClient.getLogs({
        address: volatilityVanguard.address,
        event: volatilityVanguard.abi.find((e: any) => e.name === 'RoundStarted'),
        fromBlock: receipt.blockNumber - 1n,
        toBlock: receipt.blockNumber
      });
      
      expect(logs.length).to.be.gte(1);
      const eventData = logs[logs.length - 1].args as any;
      expect(eventData.roundId).to.equal(1n);
    });

    it("Should revert when non-owner tries to start a round", async function () {
      await expect(
        volatilityVanguard.write.startNewRound({
          account: user1.account
        })
      ).to.be.rejected;
    });

    it("Should allow multiple rounds to be started", async function () {
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      await time.increase(LOCK_TIME + 1);
      
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      const roundId = await volatilityVanguard.read.currentRoundId();
      expect(roundId).to.equal(2n);
    });

    it("Should prevent starting new round when current round is still open", async function () {
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      await expect(
        volatilityVanguard.write.startNewRound({
          account: owner.account
        })
      ).to.be.rejectedWith(/Cannot start new round: current round is still open/);
      
      const roundId = await volatilityVanguard.read.currentRoundId();
      expect(roundId).to.equal(1n);
    });

    it("Should allow starting new round when lockTime has elapsed", async function () {
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      await time.increase(LOCK_TIME + 1);
      
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      const roundId = await volatilityVanguard.read.currentRoundId();
      expect(roundId).to.equal(2n);
    });

    it("Should allow starting new round when current round is settled", async function () {
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      await time.increase(LOCK_TIME + 1);
      
      await volatilityVanguard.write.settleRound([1n, 1], {
        account: oracle.account
      });
      
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      const roundId = await volatilityVanguard.read.currentRoundId();
      expect(roundId).to.equal(2n);
    });
  });

  describe("Placing Predictions", function () {
    beforeEach(async function () {
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
    });

    it("Should allow user to place a prediction with approved cUSD", async function () {
      const stakeAmount = parseEther("1");
      
      // Approve contract to spend cUSD
      await cUSD.write.approve([volatilityVanguard.address, stakeAmount], {
        account: user1.account
      });
      
      // Place prediction
      await volatilityVanguard.write.placePrediction([1n, true, stakeAmount], {
        account: user1.account
      });
      
      const prediction = await volatilityVanguard.read.getUserPrediction([1n, user1.account.address]);
      expect(Boolean(prediction[0])).to.equal(true); // hasPredicted
      expect(prediction[1]).to.equal(stakeAmount); // amount
      expect(Boolean(prediction[2])).to.equal(true); // predictsHigher
      
      // Check contract balance increased
      const contractBalance = await cUSD.read.balanceOf([volatilityVanguard.address]);
      expect(contractBalance).to.equal(stakeAmount);
    });

    it("Should revert when user hasn't approved enough cUSD", async function () {
      const stakeAmount = parseEther("1");
      
      // Try to place prediction without approval
      await expect(
        volatilityVanguard.write.placePrediction([1n, true, stakeAmount], {
          account: user1.account
        })
      ).to.be.rejected;
    });

    it("Should revert when round is not current", async function () {
      const stakeAmount = parseEther("1");
      await cUSD.write.approve([volatilityVanguard.address, stakeAmount], {
        account: user1.account
      });
      
      // Start round 2, making round 1 not current
      await time.increase(LOCK_TIME + 1);
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      // Try to place prediction on round 1 (should fail - not current)
      await expect(
        volatilityVanguard.write.placePrediction([1n, true, stakeAmount], {
          account: user1.account
        })
      ).to.be.rejectedWith(/Round is not current/);
    });

    it("Should revert when round is locked", async function () {
      const stakeAmount = parseEther("1");
      await cUSD.write.approve([volatilityVanguard.address, stakeAmount], {
        account: user1.account
      });
      
      await time.increase(LOCK_TIME + 1);
      
      await expect(
        volatilityVanguard.write.placePrediction([1n, true, stakeAmount], {
          account: user1.account
        })
      ).to.be.rejectedWith(/Round is locked/);
    });

    it("Should revert when user already predicted", async function () {
      const stakeAmount = parseEther("1");
      await cUSD.write.approve([volatilityVanguard.address, stakeAmount], {
        account: user1.account
      });
      
      await volatilityVanguard.write.placePrediction([1n, true, stakeAmount], {
        account: user1.account
      });
      
      // Approve again for second prediction
      await cUSD.write.approve([volatilityVanguard.address, stakeAmount], {
        account: user1.account
      });
      
      await expect(
        volatilityVanguard.write.placePrediction([1n, false, stakeAmount], {
          account: user1.account
        })
      ).to.be.rejectedWith(/User has already predicted/);
    });

    it("Should update round totals correctly", async function () {
      const stake1 = parseEther("1");
      const stake2 = parseEther("2");
      
      await cUSD.write.approve([volatilityVanguard.address, stake1], {
        account: user1.account
      });
      await cUSD.write.approve([volatilityVanguard.address, stake2], {
        account: user2.account
      });
      
      await volatilityVanguard.write.placePrediction([1n, true, stake1], {
        account: user1.account
      });
      await volatilityVanguard.write.placePrediction([1n, false, stake2], {
        account: user2.account
      });
      
      const roundInfo = await volatilityVanguard.read.getRoundInfo([1n]);
      expect(roundInfo[5]).to.equal(stake1 + stake2); // totalPool
      expect(roundInfo[6]).to.equal(stake1); // totalHigherStaked
      expect(roundInfo[7]).to.equal(stake2); // totalLowerStaked
    });

    it("Should emit PredictionPlaced event", async function () {
      const viem = getViem();
      const publicClient = await viem.getPublicClient();
      const stakeAmount = parseEther("1");
      
      await cUSD.write.approve([volatilityVanguard.address, stakeAmount], {
        account: user1.account
      });
      
      const tx = await volatilityVanguard.write.placePrediction([1n, true, stakeAmount], {
        account: user1.account
      });
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      const logs = await publicClient.getLogs({
        address: volatilityVanguard.address,
        event: volatilityVanguard.abi.find((e: any) => e.name === 'PredictionPlaced'),
        fromBlock: receipt.blockNumber - 1n,
        toBlock: receipt.blockNumber
      });
      
      expect(logs.length).to.be.gte(1);
      const eventData = logs[logs.length - 1].args as any;
      expect(eventData.roundId).to.equal(1n);
      expect(eventData.user.toLowerCase()).to.equal(user1.account.address.toLowerCase());
      expect(Boolean(eventData.predictsHigher)).to.equal(true);
      expect(eventData.amount).to.equal(stakeAmount);
    });
  });

  describe("Round Settlement", function () {
    beforeEach(async function () {
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      const stake1 = parseEther("1");
      const stake2 = parseEther("2");
      
      await cUSD.write.approve([volatilityVanguard.address, stake1], {
        account: user1.account
      });
      await cUSD.write.approve([volatilityVanguard.address, stake2], {
        account: user2.account
      });
      
      await volatilityVanguard.write.placePrediction([1n, true, stake1], {
        account: user1.account
      });
      await volatilityVanguard.write.placePrediction([1n, false, stake2], {
        account: user2.account
      });
    });

    it("Should allow oracle to settle round", async function () {
      await time.increase(LOCK_TIME + 1);
      
      await volatilityVanguard.write.settleRound([1n, 1], {
        account: oracle.account
      });
      
      const roundInfo = await volatilityVanguard.read.getRoundInfo([1n]);
      expect(Boolean(roundInfo[4])).to.equal(true); // isSettled
      expect(roundInfo[8]).to.equal(1); // result (Higher)
    });

    it("Should revert when non-oracle tries to settle", async function () {
      await time.increase(LOCK_TIME + 1);
      
      await expect(
        volatilityVanguard.write.settleRound([1n, 1], {
          account: user1.account
        })
      ).to.be.rejectedWith(/Only oracle can call this/);
    });

    it("Should revert when lockTime hasn't elapsed", async function () {
      await expect(
        volatilityVanguard.write.settleRound([1n, 1], {
          account: oracle.account
        })
      ).to.be.rejectedWith(/Round lock time not elapsed/);
    });

    it("Should revert with invalid result", async function () {
      await time.increase(LOCK_TIME + 1);
      
      await expect(
        volatilityVanguard.write.settleRound([1n, 0], {
          account: oracle.account
        })
      ).to.be.rejectedWith(/Invalid result/);
      
      await expect(
        volatilityVanguard.write.settleRound([1n, 3], {
          account: oracle.account
        })
      ).to.be.rejectedWith(/Invalid result/);
    });

    it("Should emit RoundSettled event", async function () {
      const viem = getViem();
      const publicClient = await viem.getPublicClient();
      
      await time.increase(LOCK_TIME + 1);
      
      const tx = await volatilityVanguard.write.settleRound([1n, 1], {
        account: oracle.account
      });
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      const logs = await publicClient.getLogs({
        address: volatilityVanguard.address,
        event: volatilityVanguard.abi.find((e: any) => e.name === 'RoundSettled'),
        fromBlock: receipt.blockNumber - 1n,
        toBlock: receipt.blockNumber
      });
      
      expect(logs.length).to.be.gte(1);
      const eventData = logs[logs.length - 1].args as any;
      expect(eventData.roundId).to.equal(1n);
      expect(eventData.result).to.equal(1);
    });
  });

  describe("Claiming Winnings", function () {
    beforeEach(async function () {
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      const stake1 = parseEther("10");
      const stake2 = parseEther("5");
      
      await cUSD.write.approve([volatilityVanguard.address, stake1], {
        account: user1.account
      });
      await cUSD.write.approve([volatilityVanguard.address, stake2], {
        account: user2.account
      });
      
      await volatilityVanguard.write.placePrediction([1n, true, stake1], {
        account: user1.account
      });
      await volatilityVanguard.write.placePrediction([1n, false, stake2], {
        account: user2.account
      });
      
      await time.increase(LOCK_TIME + 1);
      await volatilityVanguard.write.settleRound([1n, 1], {
        account: oracle.account
      });
    });

    it("Should allow winner to claim winnings", async function () {
      const user1BalanceBefore = await cUSD.read.balanceOf([user1.account.address]);
      
      await volatilityVanguard.write.claimWinnings([[1n]], {
        account: user1.account
      });
      
      const user1BalanceAfter = await cUSD.read.balanceOf([user1.account.address]);
      // User1 should receive more than their stake (they won)
      expect(user1BalanceAfter > user1BalanceBefore).to.be.true;
      
      const prediction = await volatilityVanguard.read.getUserPrediction([1n, user1.account.address]);
      expect(Boolean(prediction[3])).to.equal(true); // hasClaimed
    });

    it("Should not pay out to loser", async function () {
      const user2BalanceBefore = await cUSD.read.balanceOf([user2.account.address]);
      
      await volatilityVanguard.write.claimWinnings([[1n]], {
        account: user2.account
      });
      
      const user2BalanceAfter = await cUSD.read.balanceOf([user2.account.address]);
      // User2 should not receive anything (they lost)
      expect(user2BalanceAfter).to.equal(user2BalanceBefore);
      
      const prediction = await volatilityVanguard.read.getUserPrediction([1n, user2.account.address]);
      expect(Boolean(prediction[3])).to.equal(true); // hasClaimed
    });

    it("Should collect fee from losing pool", async function () {
      const feeReceiverBalanceBefore = await cUSD.read.balanceOf([feeReceiver.account.address]);
      
      await volatilityVanguard.write.claimWinnings([[1n]], {
        account: user1.account
      });
      
      const feeReceiverBalanceAfter = await cUSD.read.balanceOf([feeReceiver.account.address]);
      const feeAmount = (parseEther("5") * FEE_RATE) / 10000n; // Fee from losing pool
      expect(feeReceiverBalanceAfter - feeReceiverBalanceBefore).to.equal(feeAmount);
    });

    it("Should calculate payout correctly using inverse liquidity pool", async function () {
      const user1BalanceBefore = await cUSD.read.balanceOf([user1.account.address]);
      const stake1 = parseEther("10");
      const stake2 = parseEther("5");
      
      await volatilityVanguard.write.claimWinnings([[1n]], {
        account: user1.account
      });
      
      const user1BalanceAfter = await cUSD.read.balanceOf([user1.account.address]);
      const payout = user1BalanceAfter - user1BalanceBefore;
      
      // Calculate expected payout: S * ((L - Fee) / W) + S
      const losingPool = stake2;
      const feeAmount = (losingPool * FEE_RATE) / 10000n;
      const netLosingPool = losingPool - feeAmount;
      const winningPool = stake1;
      const winnings = (stake1 * netLosingPool) / winningPool;
      const expectedPayout = stake1 + winnings;
      
      // Allow small rounding difference
      expect(payout >= expectedPayout - 1n && payout <= expectedPayout + 1n).to.be.true;
    });

    it("Should revert when claiming for unsettled round", async function () {
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      const stakeAmount = parseEther("1");
      await cUSD.write.approve([volatilityVanguard.address, stakeAmount], {
        account: user1.account
      });
      
      await volatilityVanguard.write.placePrediction([2n, true, stakeAmount], {
        account: user1.account
      });
      
      await expect(
        volatilityVanguard.write.claimWinnings([[2n]], {
          account: user1.account
        })
      ).to.be.rejectedWith(/Round is not settled/);
    });

    it("Should revert when user didn't predict", async function () {
      await expect(
        volatilityVanguard.write.claimWinnings([[1n]], {
          account: user3.account
        })
      ).to.be.rejectedWith(/User did not predict/);
    });

    it("Should revert when already claimed", async function () {
      await volatilityVanguard.write.claimWinnings([[1n]], {
        account: user1.account
      });
      
      await expect(
        volatilityVanguard.write.claimWinnings([[1n]], {
          account: user1.account
        })
      ).to.be.rejectedWith(/User has already claimed/);
    });

    it("Should allow claiming multiple rounds", async function () {
      // Start and settle second round
      await time.increase(1);
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      const stake1 = parseEther("5");
      const stake2 = parseEther("3");
      
      await cUSD.write.approve([volatilityVanguard.address, stake1], {
        account: user1.account
      });
      await cUSD.write.approve([volatilityVanguard.address, stake2], {
        account: user2.account
      });
      
      await volatilityVanguard.write.placePrediction([2n, true, stake1], {
        account: user1.account
      });
      await volatilityVanguard.write.placePrediction([2n, false, stake2], {
        account: user2.account
      });
      
      await time.increase(LOCK_TIME + 1);
      await volatilityVanguard.write.settleRound([2n, 1], {
        account: oracle.account
      });
      
      // Claim both rounds
      await volatilityVanguard.write.claimWinnings([[1n, 2n]], {
        account: user1.account
      });
      
      const prediction1 = await volatilityVanguard.read.getUserPrediction([1n, user1.account.address]);
      const prediction2 = await volatilityVanguard.read.getUserPrediction([2n, user1.account.address]);
      expect(Boolean(prediction1[3])).to.equal(true);
      expect(Boolean(prediction2[3])).to.equal(true);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set oracle address", async function () {
      await volatilityVanguard.write.setOracleAddress([user1.account.address], {
        account: owner.account
      });
      
      const oracleAddr = await volatilityVanguard.read.oracleAddress();
      expect(oracleAddr.toLowerCase()).to.equal(user1.account.address.toLowerCase());
    });

    it("Should allow owner to set fee receiver", async function () {
      await volatilityVanguard.write.setFeeReceiver([user1.account.address], {
        account: owner.account
      });
      
      const feeRec = await volatilityVanguard.read.feeReceiver();
      expect(feeRec.toLowerCase()).to.equal(user1.account.address.toLowerCase());
    });

    it("Should allow owner to set fee rate", async function () {
      const newFeeRate = 500n; // 5%
      await volatilityVanguard.write.setFeeRate([newFeeRate], {
        account: owner.account
      });
      
      const fee = await volatilityVanguard.read.feeRate();
      expect(fee).to.equal(newFeeRate);
    });

    it("Should allow owner to set risk threshold", async function () {
      const newThreshold = 200n;
      await volatilityVanguard.write.setRiskThreshold([newThreshold], {
        account: owner.account
      });
      
      const threshold = await volatilityVanguard.read.riskThreshold();
      expect(threshold).to.equal(newThreshold);
    });

    it("Should allow owner to set lock time", async function () {
      const newLockTime = 14 * 24 * 60 * 60; // 14 days
      await volatilityVanguard.write.setLockTime([BigInt(newLockTime)], {
        account: owner.account
      });
      
      const lock = await volatilityVanguard.read.lockTime();
      expect(lock).to.equal(BigInt(newLockTime));
    });

    it("Should revert when non-owner tries admin functions", async function () {
      await expect(
        volatilityVanguard.write.setOracleAddress([user1.account.address], {
          account: user1.account
        })
      ).to.be.rejected;
    });

    it("Should allow owner to emergency withdraw cUSD", async function () {
      // Fund contract with some cUSD
      const amount = parseEther("10");
      await cUSD.write.transfer([volatilityVanguard.address, amount], {
        account: user1.account
      });
      
      const ownerBalanceBefore = await cUSD.read.balanceOf([owner.account.address]);
      
      await volatilityVanguard.write.emergencyWithdraw({
        account: owner.account
      });
      
      const ownerBalanceAfter = await cUSD.read.balanceOf([owner.account.address]);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(amount);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero fee rate", async function () {
      // Deploy new contract with zero fee
      const viem = getViem();
      const newContract = await viem.deployContract("VolatilityVanguard", [
        cUSD.address,
        oracle.account.address,
        feeReceiver.account.address,
        0n, // Zero fee
        RISK_THRESHOLD,
        LOCK_TIME
      ]);
      
      await newContract.write.startNewRound({
        account: owner.account
      });
      
      const stake1 = parseEther("10");
      const stake2 = parseEther("5");
      
      await cUSD.write.approve([newContract.address, stake1], {
        account: user1.account
      });
      await cUSD.write.approve([newContract.address, stake2], {
        account: user2.account
      });
      
      await newContract.write.placePrediction([1n, true, stake1], {
        account: user1.account
      });
      await newContract.write.placePrediction([1n, false, stake2], {
        account: user2.account
      });
      
      await time.increase(LOCK_TIME + 1);
      await newContract.write.settleRound([1n, 1], {
        account: oracle.account
      });
      
      const feeReceiverBalanceBefore = await cUSD.read.balanceOf([feeReceiver.account.address]);
      
      await newContract.write.claimWinnings([[1n]], {
        account: user1.account
      });
      
      const feeReceiverBalanceAfter = await cUSD.read.balanceOf([feeReceiver.account.address]);
      expect(feeReceiverBalanceAfter).to.equal(feeReceiverBalanceBefore); // No fee collected
    });

    it("Should handle getUserRounds correctly", async function () {
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      const stakeAmount = parseEther("1");
      await cUSD.write.approve([volatilityVanguard.address, stakeAmount], {
        account: user1.account
      });
      
      await volatilityVanguard.write.placePrediction([1n, true, stakeAmount], {
        account: user1.account
      });
      
      await time.increase(LOCK_TIME + 1);
      await volatilityVanguard.write.startNewRound({
        account: owner.account
      });
      
      await cUSD.write.approve([volatilityVanguard.address, stakeAmount], {
        account: user1.account
      });
      
      await volatilityVanguard.write.placePrediction([2n, false, stakeAmount], {
        account: user1.account
      });
      
      const userRounds = await volatilityVanguard.read.getUserRounds([
        user1.account.address,
        1n,
        2n
      ]);
      
      expect(userRounds.length).to.equal(2);
      expect(userRounds[0]).to.equal(1n);
      expect(userRounds[1]).to.equal(2n);
    });
  });
});
