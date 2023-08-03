import { extendConfig, extendEnvironment } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import path from "path";
import { EthLab } from "./EthLab";
import "./type-extensions";
import { task } from "hardhat/config";
import { createServer } from "./server";

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    // add ethlabPath to config
    const userPath = userConfig.paths?.ethlabPath;
    let ethlabPath: string;
    if (userPath === undefined) {
      ethlabPath = path.join(config.paths.root, "./artifacts/ethlab");
    } else {
      if (path.isAbsolute(userPath)) ethlabPath = userPath;
      else ethlabPath = path.normalize(path.join(config.paths.root, userPath));
    }

    config.paths.ethlabPath = ethlabPath;
  }
);

extendEnvironment((hre) => {
  hre.ethlab = lazyObject(() => new EthLab(hre));
});

task("ethlab", "Start the ethlab api server")
  .addPositionalParam("cmd", "Command to run", "start")
  .setAction(async (params, hre) => {
    switch (params.cmd) {
      case "start":
        throw new Error("Not implemented");
      case "api":
        createServer(hre, 3000)
          .then(() => console.log("ethlab: Server started"))
          .catch((err) => console.error(err));

        // keep the process alive
        await new Promise(() => {});
        break;
      default:
        throw new Error(`Unknown command '${params.cmd}'`);
    }
  });
