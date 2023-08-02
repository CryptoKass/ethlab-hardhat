import { extendConfig, extendEnvironment } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import path from "path";
import { EthLab } from "./EthLab";
import "./type-extensions";

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
