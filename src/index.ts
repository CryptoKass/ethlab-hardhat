import { extendConfig } from "hardhat/config";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import path from "path";
import "./type-extensions";
import { task } from "hardhat/config";
import { JsonRpcProvider } from "ethers";
import { trackDeployments } from "./trackDeployments";

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    // add ethlabOutput to config
    const userPath = userConfig.paths?.ethlabOutput;
    let ethlabOutput: string;
    if (userPath === undefined) {
      ethlabOutput = config.paths.artifacts;
    } else {
      if (path.isAbsolute(userPath)) ethlabOutput = userPath;
      else
        ethlabOutput = path.normalize(path.join(config.paths.root, userPath));
    }

    config.paths.ethlabOutput = ethlabOutput;
  }
);

task("ethlab:watcher", "Track contract deployments").setAction(
  async (args, hre) => {
    trackDeployments(hre);
    await new Promise(() => {}); // wait forever
  }
);

task("ethlab:start", "Deploy contracts").setAction(async (args, hre) => {
  console.log("\n\n🧪 STARTING LOCAL NODE 🧪");
  hre.run("node");

  // wait for connection.
  await _isChainAlive();
  hre.hardhatArguments.network = "localhost";
  hre.network.name = "localhost";

  console.log("\n\n🧪 STARTING WATCHER 🧪");
  hre.run("ethlab:watcher");

  console.log("\n\n🧪 DEPLOYING CONTRACTS 🧪");
  await hre.run("run", {
    script: "scripts/deploy.ts",
    network: "localhost",
  });

  await new Promise(() => {}); // wait forever
});

const _isChainAlive = () => {
  const rpc = new JsonRpcProvider("http://127.0.0.1:8545/");
  return new Promise((resolve, reject) => {
    let maxAttempts = 20;
    const checkInterval = setInterval(() => {
      rpc
        .getNetwork()
        .then(() => resolve(clearInterval(checkInterval)))
        .catch(() => {});

      if (maxAttempts-- === 0) {
        clearInterval(checkInterval);
        reject(new Error("Could not connect to local chain"));
      }
    }, 1000);
  }).finally(() => rpc.destroy());
};
