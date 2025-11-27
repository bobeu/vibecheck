import { HardhatRuntimeEnvironment, } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { config as dotconfig } from "dotenv";
import { toBigInt } from 'ethers';
import { formatUnits, parseEther, parseUnits, zeroAddress } from 'viem';

dotconfig();
enum Mode { LOCAL, LIVE }

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  	const {deployments, getNamedAccounts,  network} = hre;
	const { deploy, log } = deployments;
	let {   deployer, cusdAddress } = await getNamedAccounts();

	const chainId = network.config.chainId;

	if (!cusdAddress) {
		throw new Error(`cUSD address not found for chain ID: ${chainId}`);
	}

	log("----------------------------------------------------");
	log("Deploying VolatilityVanguard...");
	log(`Using cUSD address: ${cusdAddress}`);

	const volatilityVanguard = await deploy("VolatilityVanguard", {
		from: deployer,
		args: [cusdAddress],
		log: true,
		waitConfirmations: network.live ? 5 : 1,
	});

	log(`VolatilityVanguard deployed at ${volatilityVanguard.address}`);
	log("----------------------------------------------------");
	
}
export default func;

func.tags = ['VolatilityVanguard'];
