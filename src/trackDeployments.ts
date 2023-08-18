import { HardhatRuntimeEnvironment } from "hardhat/types";
import { JsonRpcProvider, Contract, toUtf8Bytes, keccak256 } from "ethers";
import fs from "fs";
import path from "path";

type Contract4Bytes = Record<string, string>;

interface ContractsData {
  deployments: DeploymentInfo[];
  interfaces: Record<string, ContractArtifact>;
}

interface ContractArtifact {
  contractName: string;
  sourceName: string;
  abi: any;
  bytecode: string;
  deployedBytecode: string;
  linkReferences: any;
  deployedLinkReferences: any;
}

interface DeploymentInfo {
  address: string;
  contractName: string;
  blockNumber: number;
}

/** trackDeployments
 * tracks all the contract deployments by listening to new blocks
 * @param hre HardhatRuntimeEnvironment
 * */
export const trackDeployments = async (hre: HardhatRuntimeEnvironment) => {
  const provider = new JsonRpcProvider("http://127.0.0.1:8545/");

  // initialize contractsData
  const contractsData: ContractsData = {
    deployments: [],
    interfaces: {},
  };
  const registry: Contract4Bytes = {};

  // 0. load contract artifacts
  console.log("[ethlab:watcher] Loading Contract artifacts");
  const contractArtifacts = _loadContractArtifacts(hre);

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
    await trackDeploymentsFromBlock(
      hre,
      provider,
      contractsData,
      registry,
      contractArtifacts,
      i
    );
  }

  // 4. track new deployments
  provider.on("block", async (blockNumber) => {
    trackDeploymentsFromBlock(
      hre,
      provider,
      contractsData,
      registry,
      contractArtifacts,
      blockNumber
    );
  });
};

export const trackDeploymentsFromBlock = async (
  hre: HardhatRuntimeEnvironment,
  provider: JsonRpcProvider,
  contractsData: ContractsData,
  registry: Contract4Bytes,
  contractArtifacts: ContractArtifact[],
  blockNumber: number
) => {
  console.log(`[ethlab:watcher] Got new block: ${blockNumber}`);
  // 1. detect all deployments in the block
  const deployments = await _extractDeploymentsFromBlock(
    hre,
    provider,
    blockNumber
  );
  console.log(`[ethlab:watcher] Found ${deployments.length} new deployments.`);

  // 2. filter the deployments thats deployed code
  // matches a registered artifact.
  const deploymentInfo = await _matchDeployments(
    hre,
    provider,
    blockNumber,
    deployments,
    contractArtifacts
  );
  contractsData.deployments.push(...deploymentInfo);
  _saveContractData(hre, contractsData);

  // 4. register 4byte signatures for the new contracts
  for (const _info of deploymentInfo) {
    const artifact = contractsData.interfaces[_info.contractName];
    if (!artifact) continue;
    _register4byte(artifact, registry);
  }
  _saveMethodRegistry(hre, registry);
};

const _loadContractArtifacts = (hre: HardhatRuntimeEnvironment) => {
  const artifactsPath = `${hre.config.paths.artifacts}/contracts`;
  const artifacts = fs.readdirSync(artifactsPath);

  const contractArtifacts: ContractArtifact[] = [];
  for (const artifact of artifacts) {
    // 1. get the contract name from the file name
    const contractName = artifact.split(".")[0];
    const artifactPath = `${artifactsPath}/${artifact}/${contractName}.json`;
    // 2. load the artifact
    const artifactJSON = fs.readFileSync(artifactPath, "utf8");
    const artifactObject = JSON.parse(artifactJSON);
    console.log(
      `[ethlab:watcher]\t→ Found artifact: ${artifactPath}` +
        `\n\t\t⎿ Contract: '${contractName}'`
    );
    contractArtifacts.push(artifactObject);
  }
  return contractArtifacts;
};

const _extractDeploymentsFromBlock = async (
  hre: HardhatRuntimeEnvironment,
  provider: JsonRpcProvider,
  blockNumber: number
) => {
  const block = await provider.getBlock(blockNumber, true);
  if (!block) throw new Error(`Block ${blockNumber} not found`);
  const transactions = block.transactions;
  const deployments: string[] = [];

  for (const txHash of transactions) {
    // 1. get the transaction
    const tx = block.getPrefetchedTransaction(txHash);
    if (tx.to !== null) continue;
    // 2. if the transaction is a contract creation, get the receipt
    const receipt = await tx.wait();
    if (receipt === null || receipt.contractAddress == null) continue;
    // 3. add the contract address to the list of deployments
    deployments.push(receipt.contractAddress);
  }

  return deployments;
};

const _matchDeployments = async (
  hre: HardhatRuntimeEnvironment,
  provider: JsonRpcProvider,
  blockNumber: number,
  deployments: string[],
  contractArtifacts: ContractArtifact[]
) => {
  const deploymentInfo: DeploymentInfo[] = [];

  for (const deployment of deployments) {
    const code = await provider.getCode(deployment);

    for (const artifact of contractArtifacts) {
      if (artifact.deployedBytecode.toLowerCase() === code.toLowerCase()) {
        console.log(
          `[ethlab:watcher]\t→ Found match for ${artifact.contractName}` +
            `\n\t\t⎿ At address: '${deployment}'` +
            `\n\t\t⎿ In Block: '${blockNumber}'`
        );
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

export const _register4byte = async (
  ContractArtifact: ContractArtifact,
  registry: Contract4Bytes
) => {
  const { abi, contractName } = ContractArtifact;
  const contract = new Contract("0x0", abi);

  contract.interface.fragments.forEach((fragment) => {
    if (fragment.type === "function") {
      const signature = fragment.format("sighash");
      const hash = keccak256(toUtf8Bytes(signature));
      const fourByte = hash.substr(0, 10);
      console.log(
        `[ethlab:watcher]\t→ Registering methodId ${fourByte}` +
          `\n\t\t⎿ Signature '${signature}'` +
          `\n\t\t⎿ Contract '${contractName}'`
      );
      registry[fourByte.toLowerCase()] = signature;
    }
  });
};

// SAVING

const _saveContractData = (
  hre: HardhatRuntimeEnvironment,
  contractsData: ContractsData
) => {
  const filepath = path.join(
    hre.config.paths.ethlabOutput,
    "contracts.data.json"
  );
  fs.writeFileSync(filepath, JSON.stringify(contractsData, null, 2));
  console.log(
    "[ethlab:watcher] contracts.data.json Updated!" +
      `\n\t\t⎿ Written to '${filepath}'`
  );
};

const _saveMethodRegistry = (
  hre: HardhatRuntimeEnvironment,
  registry: Contract4Bytes
) => {
  const filepath = path.join(
    hre.config.paths.ethlabOutput,
    "contracts.methods.json"
  );
  fs.writeFileSync(filepath, JSON.stringify(registry, null, 2));
  console.log(
    "[ethlab:watcher] contract.methods.json Updated!" +
      `\n\t\t⎿ Written to '${filepath}'`
  );
};
