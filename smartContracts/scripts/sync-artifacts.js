const fs = require('fs');
const path = require('path');

/**
 * VibeCheck Artifact Synchronization Protocol
 * Syncs deployment artifacts from Hardhat to frontend application
 * Supports both Celo Sepolia and Celo Mainnet
 */
async function syncArtifacts() {
  const networks = [
    { name: 'sepolia', chainId: 11142220 },
    { name: 'celo', chainId: 42220 }
  ];
  
  console.log(`🔄 Syncing artifacts for multiple networks...\n`);
  
  // Paths
  const artifactsPath = path.join(__dirname, '../artifacts/contracts');
  const frontendPath = path.join(__dirname, '../../frontend/src');
  
  // Create frontend directories if they don't exist
  const contractsDir = path.join(frontendPath, 'contracts');
  const abisDir = path.join(frontendPath, 'abis');
  const constantsDir = path.join(frontendPath, 'constants');
  
  [contractsDir, abisDir, constantsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const syncData = {
    networks: {}
  };

  let hasAnyDeployment = false;

  // Process each network
  for (const network of networks) {
    const { name: networkName, chainId } = network;
    const deploymentsPath = path.join(__dirname, `../deployments/${networkName}`);
    
    console.log(`📡 Processing ${networkName} (Chain ID: ${chainId})...`);
    
    try {
      // Sync VolatilityVanguard
      const deploymentPath = path.join(deploymentsPath, 'VolatilityVanguard.json');
      const artifactPath = path.join(artifactsPath, 'VolatilityVanguard.sol/VolatilityVanguard.json');
      
      if (fs.existsSync(deploymentPath) && fs.existsSync(artifactPath)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        
        // Add to sync data with chainId as key
        syncData.networks[chainId] = {
          networkName: networkName,
          chainId: chainId,
          contracts: {
            VolatilityVanguard: {
              address: deployment.address,
              abi: artifact.abi
            }
          }
        };
        
        hasAnyDeployment = true;
        console.log(`  ✅ VolatilityVanguard synced: ${deployment.address}`);
      } else {
        console.log(`  ⚠️  VolatilityVanguard not deployed on ${networkName}`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${networkName}:`, error.message);
    }
    
    console.log('');
  }

  if (!hasAnyDeployment) {
    console.log('❌ No deployments found for any network');
    return;
  }

  try {
    // Create the frontend-artifacts.json file with network-based structure
    const frontendArtifactsPath = path.join(constantsDir, 'contract-artifacts.json');
    
    fs.writeFileSync(
      frontendArtifactsPath,
      JSON.stringify(syncData, null, 2)
    );
    
    console.log('✅ Frontend artifacts successfully synced to contract-artifacts.json');
    console.log(`📊 Networks synced: ${Object.keys(syncData.networks).length}`);
    
    // Create helper file for frontend to get contract address by chainId
    const helperContent = `import contractArtifacts from './contract-artifacts.json';
import { zeroAddress, type Address } from 'viem';

export interface NetworkContracts {
  networkName: string;
  chainId: number;
  contracts: {
    VolatilityVanguard: {
      address: string;
      abi: any[];
    };
  };
}

export interface ContractArtifacts {
  networks: Record<number, NetworkContracts>;
}

/**
 * Get contract address for a specific chainId
 * @param chainId The chain ID (11142220 for Sepolia, 42220 for Mainnet)
 * @returns Contract address or zeroAddress if not found
 */
export function getVolatilityVanguardAddress(chainId: number): Address {
  const artifacts = contractArtifacts as ContractArtifacts;
  const network = artifacts.networks?.[chainId];
  
  if (!network || !network.contracts?.VolatilityVanguard?.address) {
    console.warn(\`VolatilityVanguard not found for chainId: \${chainId}\`);
    return zeroAddress;
  }
  
  return network.contracts.VolatilityVanguard.address as Address;
}

/**
 * Get contract ABI for VolatilityVanguard
 * @param chainId The chain ID (11142220 for Sepolia, 42220 for Mainnet)
 * @returns Contract ABI or empty array if not found
 */
export function getVolatilityVanguardABI(chainId: number): any[] {
  const artifacts = contractArtifacts as ContractArtifacts;
  const network = artifacts.networks?.[chainId];
  
  if (!network || !network.contracts?.VolatilityVanguard?.abi) {
    console.warn(\`VolatilityVanguard ABI not found for chainId: \${chainId}\`);
    return [];
  }
  
  return network.contracts.VolatilityVanguard.abi;
}

/**
 * Get all available network chainIds
 * @returns Array of chain IDs
 */
export function getAvailableChainIds(): number[] {
  const artifacts = contractArtifacts as ContractArtifacts;
  return Object.keys(artifacts.networks || {}).map(id => Number(id));
}

/**
 * Get network info for a specific chainId
 * @param chainId The chain ID
 * @returns Network info or null if not found
 */
export function getNetworkInfo(chainId: number): NetworkContracts | null {
  const artifacts = contractArtifacts as ContractArtifacts;
  return artifacts.networks?.[chainId] || null;
}

// Legacy export for backward compatibility (uses first available network)
const artifacts = contractArtifacts as ContractArtifacts;
const firstNetwork = Object.values(artifacts.networks || {})[0];
export const VOLATILITY_VANGUARD_ADDRESS = firstNetwork?.contracts?.VolatilityVanguard?.address || zeroAddress;
export const CHAIN_ID = firstNetwork?.chainId || 0;
export const NETWORK_NAME = firstNetwork?.networkName || '';
`;
    
    fs.writeFileSync(
      path.join(contractsDir, 'volatilityVanguardAddress.ts'),
      helperContent
    );
    
    // Create individual ABI file (use the first available network's ABI)
    const firstNetwork = Object.values(syncData.networks)[0];
    if (firstNetwork && firstNetwork.contracts?.VolatilityVanguard?.abi) {
      fs.writeFileSync(
        path.join(abisDir, 'VolatilityVanguardABI.json'),
        JSON.stringify(firstNetwork.contracts.VolatilityVanguard.abi, null, 2)
      );
      console.log('✅ ABI file synced');
    }
    
    // Print summary
    console.log('\n📋 Deployment Summary:');
    Object.entries(syncData.networks).forEach(([chainId, network]) => {
      console.log(`  ${network.networkName} (${chainId}): ${network.contracts.VolatilityVanguard.address}`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ Error writing artifacts:', error);
    throw error;
  }
}

// Auto-run sync after deployment
syncArtifacts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
