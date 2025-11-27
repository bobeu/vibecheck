import { HardhatRuntimeEnvironment, } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { config as dotconfig } from "dotenv";

dotconfig();
enum Mode { LOCAL, LIVE }

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  	const {deployments, getNamedAccounts,  network} = hre;
	const { deploy, log } = deployments;
	let { 
		deployer,
		cusdAddress,
		oracleAddress,
        feeReceiver
	} = await getNamedAccounts();

	console.log("deployer", deployer);
	console.log("oracleAddress", oracleAddress);
	console.log("feeReceiver", feeReceiver);

	const LOCK_TIME_SECONDS = 60 * 60 * 24 * 7;
	const FEE_RATE = 250;
	const RISK_THRESHOLD = 150;
	const chainId = network.config.chainId;

	if (!cusdAddress) {
		throw new Error(`cUSD address not found for chain ID: ${chainId}`);
	}

	log("----------------------------------------------------");
	log("Deploying VolatilityVanguard...");
	log(`Using cUSD address: ${cusdAddress}`);

	const volatilityVanguard = await deploy("VolatilityVanguard", {
		from: deployer,
		args: [
			oracleAddress,
			feeReceiver,
			FEE_RATE,
			RISK_THRESHOLD,
			LOCK_TIME_SECONDS
		],
		log: true,
		waitConfirmations: network.live ? 5 : 1,
	});

	log(`VolatilityVanguard deployed at ${volatilityVanguard.address}`);
	log("----------------------------------------------------");
	
}
export default func;

func.tags = ['VolatilityVanguard'];
