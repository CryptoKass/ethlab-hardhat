import "@nomicfoundation/hardhat-ethers";
import "hardhat/types/config";
import "hardhat/types/runtime";
declare module "hardhat/types/config" {
    interface ProjectPathsUserConfig {
        ethlabOutput?: string;
    }
    interface ProjectPathsConfig {
        ethlabOutput: string;
    }
}
//# sourceMappingURL=type-extensions.d.ts.map