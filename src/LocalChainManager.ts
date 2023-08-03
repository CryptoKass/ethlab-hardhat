import { spawn } from "child_process";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import treeKill from "tree-kill";
import { JsonRpcProvider } from "ethers";
import fs from "fs";
import path from "path";

export class LocalChainManager {
  pid: number | undefined;
  hre: HardhatRuntimeEnvironment;

  constructor(hre: HardhatRuntimeEnvironment) {
    this.hre = hre;
    process.on("exit", () => this.stop());
  }

  async start() {
    console.log("ethlab: Starting local chain...");
    await this.startChain();
    console.log(`ethlab: Started local chain with PID '${this.pid}'`);

    console.log("ethlab: Deploying contracts to local chain...");
    await this.deployContracts();
    console.log("ethlab: Deployed contracts to local chain");
  }

  stop() {
    return new Promise<void>((resolve, reject) => {
      if (this.pid === undefined) return resolve();
      treeKill(this.pid, (err) => {
        if (err) return reject(err);
        console.log(`ethlab: Stopped local chain with PID '${this.pid}'`);
        resolve();
      });
    });
  }

  private startChain() {
    return new Promise<void>((resolve, reject) => {
      const instance = spawn("npx", ["hardhat", "node"]);

      instance.stdout.on("data", (data) => {
        console.log(`chain: ${data}`);
      });

      instance.stderr.on("data", (data) => {
        console.error(`chain: ${data}`);
      });

      instance.on("close", (code) => {
        console.log(`chain: exited with code ${code}`);
        reject(new Error("Local chain exited"));
      });

      this.pid = instance.pid;

      // check the node is running
      let maxAttempts = 20;
      const checkInterval = setInterval(() => {
        new JsonRpcProvider("http://127.0.0.1:8545/")
          .getNetwork()
          .then(() => resolve(clearInterval(checkInterval)))
          .catch(() => {});

        if (maxAttempts-- === 0) {
          clearInterval(checkInterval);
          reject(new Error("Could not connect to local chain"));
        }
      }, 1000);
    });
  }

  private async deployContracts() {
    await this.hre.run("run", {
      script: "scripts/deploy.ts",
      network: "localhost",
    });

    // open the file: contracts.json and
    // deployments.json files and read the contents
    // into memory

    const contractsPath = path.join(
      this.hre.config.paths.ethlabPath,
      "./contracts.json"
    );
    const contracts = JSON.parse(fs.readFileSync(contractsPath).toString());

    const deploymentsPath = path.join(
      this.hre.config.paths.ethlabPath,
      "./deployments.json"
    );
    const deployments = JSON.parse(fs.readFileSync(deploymentsPath).toString());

    this.hre.ethlab.contracts = contracts;
    this.hre.ethlab.deploymentInfo = deployments;
  }
}
