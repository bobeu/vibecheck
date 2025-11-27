import type { HardhatUserConfig } from "hardhat/config";
import { config as dotconfig } from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "@nomiclabs/hardhat-web3";
import "@nomicfoundation/hardhat-viem";

dotconfig();

const config: HardhatUserConfig = {
  
  networks: {
    sepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      accounts: [`${process.env.PRIVATE_0xD7c}`],
      chainId: 11_142220,
      saveDeployments: true
    },
    celo: {
      accounts: [`${process.env.PRIVATE_MAIN_0xa1f}`],
      url: 'https://forno.celo.org', // || 'https://celo.drpc.org'
      chainId: 42220,
      gas: 8000000,
      gasPrice: 1000000000,
      saveDeployments: true
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
    apiKey: {
      celoSepolia: process.env.ETHERSCAN_API_KEY ?? '',
      celo: process.env.ETHERSCAN_API_KEY ?? '',
    },
    customChains: [
      {
        chainId: 11_142220,
        network: 'sepolia',
        urls: {
          apiURL: 'https://forno.celo-sepolia.celo-testnet.org',
          browserURL: 'https://sepolia.celoscan.io',
        },
      },
      {
        chainId: 42_220,
        network: 'celo',
        urls: {
          apiURL: 'https://api.celoscan.io/api',
          browserURL: 'https://celoscan.io/',
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  namedAccounts: {
    deployer: {
      default: 0,
      11142220: `privatekey://${process.env.PRIVATE_0xD7c}`,
      42220: `privatekey://${process.env.PRIVATE_farc}`,
    },
    feeReceiver: {
      default: 0,
      11142220: `privatekey://${process.env.PRIVATE_0xD7c}`,
      42220: `privatekey://${process.env.PRIVATE_farc}`,
    },
    oracleAddress: {
      default: 0,
      11142220: `privatekey://${process.env.PRIVATE_0xD7c}`,
      42220: `privatekey://${process.env.PRIVATE_farc}`,
    },
    cusdAddress: {
      default: 1,
      11142220: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
      42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    }
  },

  solidity: {
    version: "0.8.28",
    settings: {          // See the solidity docs for advice about optimization and evmVersion
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'prague',
      }
    },
};

export default config;
