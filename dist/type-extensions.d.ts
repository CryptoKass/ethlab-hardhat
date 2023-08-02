import "@nomicfoundation/hardhat-ethers";
import "hardhat/types/config";
import "hardhat/types/runtime";
import { EthLab } from "./EthLab";
declare module "hardhat/types/config" {
    interface ProjectPathsUserConfig {
        ethlabPath?: string;
    }
    interface ProjectPathsConfig {
        ethlabPath: string;
    }
}
declare module "hardhat/types/runtime" {
    interface HardhatRuntimeEnvironment {
        ethlab: EthLab;
    }
}
//# sourceMappingURL=type-extensions.d.ts.map