import "./type-extensions";
import fs from "fs";
import { Contract, ContractMethodArgs, ContractFactory } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

interface ContractInfo {
  name: string;
  abi: string;
}

interface DeploymentInfo {
  name: string;
  tx: string;
  block: number;
  address: string;
}

export class EthLab {
  hre: HardhatRuntimeEnvironment;
  contracts: Record<string, ContractInfo> = {};
  deploymentInfo: DeploymentInfo[] = [];

  constructor(hre: HardhatRuntimeEnvironment) {
    this.hre = hre;

    process.on("exit", () => this.save());
    process.on("SIGINT", () => this.save());
    process.on("SIGTERM", () => this.save());
  }

  async registerABI(name: string, abi: string) {
    this.contracts[name] = {
      name,
      abi,
    };
  }

  async registerContract(name: string, contract: Contract) {
    // save contract info
    this.registerABI(name, contract.interface.formatJson());

    const tx = contract.deploymentTransaction();

    // save deployment info
    this.deploymentInfo.push({
      name,
      block: tx?.blockNumber || 0,
      tx: tx?.hash || "",
      address: await contract.getAddress(),
    });

    console.log(
      `ethlab: Registered contract ${name} at ${await contract.getAddress()}`
    );
  }

  async deployContract(name: string, args: ContractMethodArgs<any[]> = []) {
    const factory = await this.hre.ethers.getContractFactory(name);
    const contract = (await factory.deploy(...args)) as Contract;
    await contract.waitForDeployment();

    await this.registerContract(name, contract);
    return contract;
  }

  save() {
    if (
      Object.values(this.contracts).length === 0 &&
      this.deploymentInfo.length === 0
    )
      return console.log("ethlab: No contracts to save");

    const config = this.hre.config;
    const contractsPath = config.paths.ethlabPath + "/contracts.json";
    const deploymentsPath = config.paths.ethlabPath + "/deployments.json";

    // 1. save contracts
    fs.writeFileSync(contractsPath, JSON.stringify(this.contracts, null, 2));
    console.log(`ethlab: Saved contract info '${contractsPath}'`);

    // 2. sort deployment info by block number
    this.deploymentInfo.sort((a, b) => a.block - b.block);

    // 3. save deployment info
    fs.writeFileSync(
      deploymentsPath,
      JSON.stringify(this.deploymentInfo, null, 2)
    );
    console.log(`ethlab: Saved deployment info '${deploymentsPath}'`);
  }
}
