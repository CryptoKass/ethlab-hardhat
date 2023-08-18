"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._register4byte = exports.trackDeploymentsFromBlock = exports.trackDeployments = void 0;
const ethers_1 = require("ethers");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/** trackDeployments
 * tracks all the contract deployments by listening to new blocks
 * @param hre HardhatRuntimeEnvironment
 * */
const trackDeployments = async (hre) => {
    const provider = new ethers_1.JsonRpcProvider("http://127.0.0.1:8545/");
    // initialize contractsData
    const contractsData = {
        deployments: [],
        interfaces: {},
    };
    const registry = {};
    // 0. load contract artifacts
    console.log("[ethlab:watcher] Loading Contract artifacts");
    const contractArtifacts = await _loadContractArtifacts(hre);
    // 1. mount artifacts
    for (const artifact of contractArtifacts) {
        contractsData.interfaces[artifact.contractName] = artifact;
    }
    // 2. save
    _saveContractData(hre, contractsData);
    const latestBlock = await provider.getBlockNumber();
    const startBlock = Math.max(latestBlock - 5, 0);
    for (let i = startBlock; i <= latestBlock; i++) {
        // 3. track existing deployments
        await (0, exports.trackDeploymentsFromBlock)(hre, provider, contractsData, registry, contractArtifacts, i);
    }
    // 4. track new deployments
    provider.on("block", async (blockNumber) => {
        (0, exports.trackDeploymentsFromBlock)(hre, provider, contractsData, registry, contractArtifacts, blockNumber);
    });
};
exports.trackDeployments = trackDeployments;
const trackDeploymentsFromBlock = async (hre, provider, contractsData, registry, contractArtifacts, blockNumber) => {
    console.log(`[ethlab:watcher] Got new block: ${blockNumber}`);
    // 1. detect all deployments in the block
    const deployments = await _extractDeploymentsFromBlock(hre, provider, blockNumber);
    console.log(`[ethlab:watcher] Found ${deployments.length} new deployments.`);
    // 2. filter the deployments thats deployed code
    // matches a registered artifact.
    const deploymentInfo = await _matchDeployments(hre, provider, blockNumber, deployments, contractArtifacts);
    contractsData.deployments.push(...deploymentInfo);
    _saveContractData(hre, contractsData);
    // 4. register 4byte signatures for the new contracts
    for (const _info of deploymentInfo) {
        const artifact = contractsData.interfaces[_info.contractName];
        if (!artifact)
            continue;
        (0, exports._register4byte)(artifact, registry);
    }
    _saveMethodRegistry(hre, registry);
};
exports.trackDeploymentsFromBlock = trackDeploymentsFromBlock;
const _loadContractArtifacts = async (hre) => {
    await hre.run("compile");
    const artifactsPath = `${hre.config.paths.artifacts}/contracts`;
    const artifacts = fs_1.default.readdirSync(artifactsPath);
    const contractArtifacts = [];
    for (const artifact of artifacts) {
        // 1. get the contract name from the file name
        const contractName = artifact.split(".")[0];
        const artifactPath = `${artifactsPath}/${artifact}/${contractName}.json`;
        // 2. load the artifact
        const artifactJSON = fs_1.default.readFileSync(artifactPath, "utf8");
        const artifactObject = JSON.parse(artifactJSON);
        console.log(`[ethlab:watcher]\t→ Found artifact: ${artifactPath}` +
            `\n\t\t⎿ Contract: '${contractName}'`);
        contractArtifacts.push(artifactObject);
    }
    return contractArtifacts;
};
const _extractDeploymentsFromBlock = async (hre, provider, blockNumber) => {
    const block = await provider.getBlock(blockNumber, true);
    if (!block)
        throw new Error(`Block ${blockNumber} not found`);
    const transactions = block.transactions;
    const deployments = [];
    for (const txHash of transactions) {
        // 1. get the transaction
        const tx = block.getPrefetchedTransaction(txHash);
        if (tx.to !== null)
            continue;
        // 2. if the transaction is a contract creation, get the receipt
        const receipt = await tx.wait();
        if (receipt === null || receipt.contractAddress == null)
            continue;
        // 3. add the contract address to the list of deployments
        deployments.push(receipt.contractAddress);
    }
    return deployments;
};
const _matchDeployments = async (hre, provider, blockNumber, deployments, contractArtifacts) => {
    const deploymentInfo = [];
    for (const deployment of deployments) {
        const code = await provider.getCode(deployment);
        for (const artifact of contractArtifacts) {
            if (artifact.deployedBytecode.toLowerCase() === code.toLowerCase()) {
                console.log(`[ethlab:watcher]\t→ Found match for ${artifact.contractName}` +
                    `\n\t\t⎿ At address: '${deployment}'` +
                    `\n\t\t⎿ In Block: '${blockNumber}'`);
                deploymentInfo.push({
                    address: deployment,
                    contractName: artifact.contractName,
                    blockNumber,
                });
            }
        }
    }
    return deploymentInfo;
};
const _register4byte = async (ContractArtifact, registry) => {
    const { abi, contractName } = ContractArtifact;
    const contract = new ethers_1.Contract("0x0", abi);
    contract.interface.fragments.forEach((fragment) => {
        if (fragment.type === "function") {
            const signature = fragment.format("sighash");
            const hash = (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(signature));
            const fourByte = hash.substr(0, 10);
            console.log(`[ethlab:watcher]\t→ Registering methodId ${fourByte}` +
                `\n\t\t⎿ Signature '${signature}'` +
                `\n\t\t⎿ Contract '${contractName}'`);
            registry[fourByte.toLowerCase()] = signature;
        }
    });
};
exports._register4byte = _register4byte;
// SAVING
const _saveContractData = (hre, contractsData) => {
    const filepath = path_1.default.join(hre.config.paths.ethlabOutput, "contracts.data.json");
    fs_1.default.writeFileSync(filepath, JSON.stringify(contractsData, null, 2));
    console.log("[ethlab:watcher] contracts.data.json Updated!" +
        `\n\t\t⎿ Written to '${filepath}'`);
};
const _saveMethodRegistry = (hre, registry) => {
    const filepath = path_1.default.join(hre.config.paths.ethlabOutput, "contracts.methods.json");
    fs_1.default.writeFileSync(filepath, JSON.stringify(registry, null, 2));
    console.log("[ethlab:watcher] contract.methods.json Updated!" +
        `\n\t\t⎿ Written to '${filepath}'`);
};
//# sourceMappingURL=trackDeployments.js.map