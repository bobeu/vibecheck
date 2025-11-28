import { config as dotconfig } from "dotenv";
import hre from "hardhat";
import { parseEther } from "viem";

dotconfig();

// Type assertion for hre.viem
const getViem = () => (hre as any).viem;

async function main() {
  const viem = getViem();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  // Configuration
  const recipientAddress = "0xd7c271d20c9e323336bfc843aeb8dec23b346352" as `0x${string}`;
  const amountToMint = parseEther("1000"); // Mint 1000 mock cUSD (adjust as needed)
  const network = hre.network.name;
  const chainId = await publicClient.getChainId();

  console.log("==========================================");
  console.log("Minting Mock cUSD");
  console.log("==========================================");
  console.log(`Network: ${network} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${deployer.account.address}`);
  console.log(`Recipient: ${recipientAddress}`);
  console.log(`Amount: ${amountToMint.toString()} wei (${parseFloat(amountToMint.toString()) / 1e18} tokens)`);
  console.log("==========================================\n");

  // Check if MockERC20 is already deployed (from environment variable or known address)
  // For Celo Sepolia, you can set NEXT_PUBLIC_MOCK_CUSD_ADDRESS_SEPOLIA in .env
  let mockCUSDAddress: `0x${string}` | undefined;

  // Try to get from environment variable first
  // Set FORCE_REDEPLOY=true to force a new deployment
  const forceRedeploy = process.env.FORCE_REDEPLOY === 'true';
  
  if (!forceRedeploy) {
    if (chainId === 11142220) {
      mockCUSDAddress = process.env.MOCK_CUSD_ADDRESS_SEPOLIA as `0x${string}` | undefined;
    } else if (chainId === 42220) {
      mockCUSDAddress = process.env.MOCK_CUSD_ADDRESS_MAINNET as `0x${string}` | undefined;
    }
  }

  // If no address provided or force redeploy, deploy a new MockERC20 contract
  if (!mockCUSDAddress || forceRedeploy) {
    console.log("No MockERC20 address found. Deploying new contract...\n");
    
    const MockERC20 = await viem.deployContract("MockERC20", [
      "Mock cUSD",
      "mcUSD",
      18
    ]);

    mockCUSDAddress = MockERC20.address as `0x${string}`;
    console.log(`✅ MockERC20 deployed at: ${mockCUSDAddress}`);
    
    // Wait a bit for the contract to be fully available
    console.log("Waiting for contract to be available...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("✅ Contract ready\n");
    
    console.log(`💡 Add this to your .env file:`);
    if (chainId === 11142220) {
      console.log(`   MOCK_CUSD_ADDRESS_SEPOLIA=${mockCUSDAddress}`);
    } else if (chainId === 42220) {
      console.log(`   MOCK_CUSD_ADDRESS_MAINNET=${mockCUSDAddress}`);
    }
    console.log();
  } else {
    console.log(`Using existing MockERC20 at: ${mockCUSDAddress}\n`);
  }

  // Get the MockERC20 contract instance with proper ABI
  const mockERC20 = await viem.getContractAt("MockERC20", mockCUSDAddress);

  // Check current balance using the contract's ABI
  let currentBalance: bigint;
  try {
    currentBalance = await mockERC20.read.balanceOf([recipientAddress]);
  } catch (error) {
    // If balanceOf fails, assume balance is 0 (might be a new contract)
    console.log("⚠️  Could not read balance (contract may be new), assuming 0");
    currentBalance = 0n;
  }

  console.log(`Current balance of ${recipientAddress}: ${currentBalance.toString()} wei`);
  console.log(`(${parseFloat(currentBalance.toString()) / 1e18} tokens)\n`);

  // Mint tokens using the contract instance
  console.log("Minting tokens...");
  const hash = await mockERC20.write.mint([recipientAddress, amountToMint], {
    account: deployer.account,
  });

  console.log(`Transaction hash: ${hash}`);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

  // Wait a moment for state to update
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check new balance
  let newBalance: bigint;
  try {
    newBalance = await mockERC20.read.balanceOf([recipientAddress]);
  } catch (error: any) {
    console.error("Error reading balance:", error.message);
    // Try reading directly with publicClient as fallback
    const erc20Abi = [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ] as const;
    newBalance = await publicClient.readContract({
      address: mockCUSDAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [recipientAddress],
    });
  }

  console.log(`\n✅ Mint successful!`);
  console.log(`New balance of ${recipientAddress}: ${newBalance.toString()} wei`);
  console.log(`(${parseFloat(newBalance.toString()) / 1e18} tokens)`);
  console.log(`\n📋 Contract Address: ${mockCUSDAddress}`);
  console.log(`🔗 Transaction: ${receipt.transactionHash}`);
  
  // Show explorer link
  if (chainId === 11142220) {
    console.log(`🌐 Explorer: https://celo-sepolia.blockscout.com/tx/${receipt.transactionHash}`);
  } else if (chainId === 42220) {
    console.log(`🌐 Explorer: https://celoscan.io/tx/${receipt.transactionHash}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

