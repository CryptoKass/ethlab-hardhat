import "@nomicfoundation/hardhat-ethers";
import "hardhat/types/config";
import "hardhat/types/runtime";

// register ethlabPath in config
declare module "hardhat/types/config" {
  export interface ProjectPathsUserConfig {
    ethlabOutput?: string;
  }
  export interface ProjectPathsConfig {
    ethlabOutput: string;
  }
}
