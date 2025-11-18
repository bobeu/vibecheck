const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  // cUSD addresses for different networks
  const cUSDAddresses = {
    11142220: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Celo Testnet
    42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a"    // Celo Mainnet
  };

  const chainId = network.config.chainId;
  const cUSDAddress = cUSDAddresses[chainId];

  if (!cUSDAddress) {
    throw new Error(`cUSD address not found for chain ID: ${chainId}`);
  }

  log("----------------------------------------------------");
  log("Deploying VolatilityVanguard...");
  log(`Using cUSD address: ${cUSDAddress}`);

  const volatilityVanguard = await deploy("VolatilityVanguard", {
    from: deployer,
    args: [cUSDAddress],
    log: true,
    waitConfirmations: network.live ? 5 : 1,
  });

  log(`VolatilityVanguard deployed at ${volatilityVanguard.address}`);
  log("----------------------------------------------------");
};

module.exports.tags = ["VolatilityVanguard"];
