#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const campaignTemplateArtifacts = require('./artifacts/contracts/v3/CampaignTemplate.sol/CampaignTemplate.json');
const erc20Artifacts = require('./artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json');

// Configuration - directory files
const HARDHAT_ARTIFACTS_PATH = './deployments/';
const REACT_DATA_PATH = '../eduFi/contractsArtifacts';
const CAMPAIGN_TEMPLATE_ABI_PATH = '../eduFi/contractsArtifacts/template.json';
const ERC20_ABI_PATH ='../eduFi/contractsArtifacts/erc20.json';
const GLOBAL_OUTPUT_PATH = '../eduFi/contractsArtifacts/global.json';
const approvedFunctions = [
    'setCreationFee', 
    'setFeeTo',
    'setVerifier', 
    'setApprovalFactory', 
    'createCampaign', 
    'getUserCampaigns', 
    'getData', 
    'hasApproval', 
    'removeApproval', 
    'setApproval', 
    'setFactory', 
    'getFactory', 
    'verify', 
    'verifyByApprove', 
    'toggleUseWalletVerification', 
    'banOrUnbanUser', 
    'getVerificationStatus', 
    'panicWithdraw', 
    'withdraw', 
    'owner',
    'editMetaData',
    'getCampaignData', 
    'getFactoryData', 
    'getInterfacerData', 
    'addFund', 
    'claimRewardForPOINT', 
    'claimRewardForPOASS', 
    'submitProofOfIntegration', 
    'approveIntegration',
    'proveAssimilation', 
    'epochSetting', 
    'pause', 
    'setNewOwner',
    'unpause', 
    'owner',
    'isVerified'
];

// const readFunctions = ['getUserCampaigns', 'getData', 'hasApproval', 'getFactory', 'getVerificationStatus'];
// const functionsRequireArgUpdate = approvedFunctions;
const requiredContracts = ['ApprovalFactory.json', 'CampaignFactory.json', 'FeeManager.json', 'IdentityVerifier.json', 'Interfacer.json'];
const chainName = {11142220: 'sepolia', 42220: 'celo'};
const chainIds = [11142220, 42220]
let workBuild = {
    11142220: [],
    42220: [],
};

const campaignTemplateContents = {
    abi: campaignTemplateArtifacts.abi,
    contractName: campaignTemplateArtifacts.contractName
}

const erc20ArtifactsContents = {
    abi: erc20Artifacts.abi,
    contractName: erc20Artifacts.contractName
}

let globalOutput = {
    approvedFunctions: approvedFunctions,
    chainName: chainName,
    chainIds: chainIds,
    paths: workBuild,
    contractAddresses: [
        {
            "stablecoin": '',
            "ApprovalFactory": "",
            "CampaignFactory": "",
            "IdentityVerifier": "",
            "Interfacer": "",
            "FeeManager": "",
        },
        {
            "stablecoin": '0x765de816845861e75a25fca122bb6898b8b1282a',
            "ApprovalFactory": "",
            "CampaignFactory": "",
            "IdentityVerifier": "",
            "Interfacer": "",
            "FeeManager": "",
        }
    ],
};
// {"stablecoin": "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"}, 

let itemOutput = {
    contractAddress: '',
    functionName: '',
    inputCount: 0,
    requireArgUpdate: false,
    abi: []
};

// Create the React ABI directory if it doesn't exist
if (!fs.existsSync(REACT_DATA_PATH)) {
    fs.mkdirSync(REACT_DATA_PATH, { recursive: true });
}
// if (!fs.existsSync(CAMPAIGN_TEMPLATE_ABI_PATH)) {
//     fs.mkdirSync(CAMPAIGN_TEMPLATE_ABI_PATH, { recursive: true });
// }

// Function to walk through directories recursively
function walkDir(dir) {
    let list = fs.readdirSync(dir);
    if(list.includes('contracts.json')){
        list = list.filter((item) => item !== 'contracts.json')
    }
    
    chainIds.forEach((chain) => {
        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            const isChainRelated = filePath.includes(chainName[chain]);
            const fileWithSolcInputs = file.includes('solcInputs');
            const fileWithChainId = file.endsWith('.chainId');
            const onlyRequired = requiredContracts.includes(file);
            if (stat && stat.isDirectory() && !fileWithSolcInputs && !fileWithChainId) {
                if(isChainRelated){
                    workBuild[chain].concat(walkDir(filePath));
                }
            } else {
                if(isChainRelated && !fileWithSolcInputs && !fileWithChainId && onlyRequired) workBuild[chain].push(filePath);
            }
        });
    })
    return workBuild;
}

// Main script
console.log("🔄 Syncing contracts data to Next App...");

try {
    // Find all artifact JSON files
    walkDir(HARDHAT_ARTIFACTS_PATH); 
    chainIds.forEach((chainId) => {
        workBuild[chainId].forEach(filepath => {
            const artifact = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            const basename = path.basename(filepath).replace('.json', '');

            // Extract and save all the required data such as the ABI, contractAddress, inputs etc
            artifact.abi.forEach((item) => {
                if(item.type === 'function' && approvedFunctions.includes(item.name)) {
                    let inputs = [];
                    const chainIndex = chainIds.indexOf(chainId);
                    item.inputs && item.inputs.forEach((input) => {
                        inputs.push(input.name);
                    });
                    // const isReadFunction = readFunctions.includes(item.name);
                    const dir = `${REACT_DATA_PATH}/${chainId}`;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    const stdItemOutPath = path.join(dir, `${item.name}.json`);
                    // console.log("stdItemOutPath", stdItemOutPath);
                    itemOutput.abi =  artifact.abi;
                    itemOutput.inputCount = inputs.length;
                    itemOutput.functionName = item.name;
                    itemOutput.contractAddress = artifact.address;
                    // itemOutput.requireArgUpdate = functionsRequireArgUpdate.includes(item.name)
                    fs.writeFileSync(stdItemOutPath, JSON.stringify(itemOutput, null, 2));
                    globalOutput.contractAddresses[chainIndex][basename] = artifact.address;

                }
            })
        });

    });
    fs.writeFileSync(GLOBAL_OUTPUT_PATH, JSON.stringify(globalOutput, null, 2));
    fs.writeFileSync(CAMPAIGN_TEMPLATE_ABI_PATH, JSON.stringify(campaignTemplateContents, null, 2));
    fs.writeFileSync(ERC20_ABI_PATH, JSON.stringify(erc20ArtifactsContents, null, 2));
    console.log("✅ Data synchronization completed!");
} catch (error) {
    console.error("❌ Error syncing ABIs:", error);
    process.exit(1);
}
