const fs = require('fs');
const path = require('path');

/**
 * VibeCheck Artifact Synchronization Protocol
 * Syncs deployment artifacts from Hardhat to frontend application
 */
async function syncArtifacts() {
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId;
  
  console.log(`🔄 Syncing artifacts for network: ${networkName} (Chain ID: ${chainId})`);
  
  // Paths
  const deploymentsPath = path.join(__dirname, `../deployments/${networkName}`);
  const artifactsPath = path.join(__dirname, '../artifacts/contracts');
  const frontendPath = path.join(__dirname, '../src');
  
  // Create frontend directories if they don't exist
  const contractsDir = path.join(frontendPath, 'contracts');
  const abisDir = path.join(frontendPath, 'abis');
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  const syncData = {
    chainId: chainId,
    networkName: networkName,
    contracts: {}
  };

  try {
    // Sync VolatilityVanguard
    const deploymentPath = path.join(deploymentsPath, 'VolatilityVanguard.json');
    const artifactPath = path.join(artifactsPath, 'VolatilityVanguard.sol/VolatilityVanguard.json');
    
    if (fs.existsSync(deploymentPath) && fs.existsSync(artifactPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      // Add to sync data
      syncData.contracts.VolatilityVanguard = {
        address: deployment.address,
        abi: artifact.abi
      };
      
      // Create individual address file
      const addressContent = `export const VOLATILITY_VANGUARD_ADDRESS = "${deployment.address}";
export const CHAIN_ID = ${chainId};
export const NETWORK_NAME = "${networkName}";
`;
      
      fs.writeFileSync(
        path.join(contractsDir, 'volatilityVanguardAddress.ts'),
        addressContent
      );
      
      // Create individual ABI file
      fs.writeFileSync(
        path.join(abisDir, 'VolatilityVanguardABI.json'),
        JSON.stringify(artifact.abi, null, 2)
      );
      
      console.log('✅ VolatilityVanguard artifacts synced successfully');
    } else {
      console.log('❌ VolatilityVanguard deployment or artifact not found');
    }
    
    // Create the mandatory frontend-artifacts.json file
    const frontendArtifactsPath = path.join(frontendPath, 'constants/contract-artifacts.json');
    const constantsDir = path.dirname(frontendArtifactsPath);
    
    if (!fs.existsSync(constantsDir)) {
      fs.mkdirSync(constantsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      frontendArtifactsPath,
      JSON.stringify(syncData, null, 2)
    );
    
    console.log('✅ Frontend artifacts successfully synced to contract-artifacts.json');
    console.log(`📍 Contract Address: ${syncData.contracts.VolatilityVanguard?.address || 'Not deployed'}`);
    console.log(`🌐 Network: ${networkName} (${chainId})`);
    
  } catch (error) {
    console.error('❌ Error syncing artifacts:', error);
  }
}

// Auto-run sync after deployment
syncArtifacts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
