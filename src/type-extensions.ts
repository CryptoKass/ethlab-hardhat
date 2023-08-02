import "@nomicfoundation/hardhat-ethers";
import "hardhat/types/config";
import "hardhat/types/runtime";

import { EthLab } from "./EthLab";

// register ethlabPath in config
declare module "hardhat/types/config" {
  export interface ProjectPathsUserConfig {
    ethlabPath?: string;
  }
  export interface ProjectPathsConfig {
    ethlabPath: string;
  }
}

// register ethlab in runtime environment
declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    ethlab: EthLab;
  }
}
