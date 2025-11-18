require('@nomiclabs/hardhat-ethers');
require('hardhat-deploy');
require('@nomiclabs/hardhat-etherscan');
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    celoTestnet: {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11142220,
      gas: 8000000,
      gasPrice: 1000000000,
      saveDeployments: true
    },
    celoMainnet: {
      url: "https://forno.celo.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42220,
      gas: 8000000,
      gasPrice: 1000000000,
      saveDeployments: true
    }
  },
  namedAccounts: {
    deployer: {
      default: 0
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy"
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
