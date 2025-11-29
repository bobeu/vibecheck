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

  // Configuration - multiple recipients
  const recipientAddresses: `0x${string}`[] = [
    "0x813Af3052B521fF0E96576702399a1D5b8C93fCe" as `0x${string}`,
    "0x04B679357f6e40C40F4E7d9AfBf9Ffb2756f9Bc7" as `0x${string}`,
  ];
  const amountToMint = parseEther("1000"); // Mint 1000 mock cUSD to each address
  const network = hre.network.name;
  const chainId = await publicClient.getChainId();

  console.log("==========================================");
  console.log("Minting Mock cUSD to Multiple Addresses");
  console.log("==========================================");
  console.log(`Network: ${network} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${deployer.account.address}`);
  console.log(`Recipients: ${recipientAddresses.length} addresses`);
  console.log(`Amount per address: ${amountToMint.toString()} wei (${parseFloat(amountToMint.toString()) / 1e18} tokens)`);
  console.log("==========================================\n");

  // Check if MockERC20 is already deployed (from environment variable or known address)
  let mockCUSDAddress: `0x${string}` | undefined;

  // Try to get from environment variable first
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

  // Mint to each recipient
  for (let i = 0; i < recipientAddresses.length; i++) {
    const recipientAddress = recipientAddresses[i];
    
    console.log(`\n[${i + 1}/${recipientAddresses.length}] Processing ${recipientAddress}...`);
    
    // Check current balance
    let currentBalance: bigint;
    try {
      currentBalance = await mockERC20.read.balanceOf([recipientAddress]);
      console.log(`Current balance: ${currentBalance.toString()} wei (${parseFloat(currentBalance.toString()) / 1e18} tokens)`);
    } catch (error) {
      console.log("⚠️  Could not read balance (contract may be new), assuming 0");
      currentBalance = 0n;
    }

    // Mint tokens
    console.log(`Minting ${parseFloat(amountToMint.toString()) / 1e18} tokens...`);
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

    console.log(`✅ Mint successful for ${recipientAddress}`);
    console.log(`New balance: ${newBalance.toString()} wei (${parseFloat(newBalance.toString()) / 1e18} tokens)`);
    
    // Show explorer link
    if (chainId === 11142220) {
      console.log(`🔗 Explorer: https://celo-sepolia.blockscout.com/tx/${receipt.transactionHash}`);
    } else if (chainId === 42220) {
      console.log(`🔗 Explorer: https://celoscan.io/tx/${receipt.transactionHash}`);
    }
  }

  console.log(`\n==========================================`);
  console.log(`✅ All mints completed!`);
  console.log(`📋 Contract Address: ${mockCUSDAddress}`);
  console.log(`==========================================`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

