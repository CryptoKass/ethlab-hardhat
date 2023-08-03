import { HardhatRuntimeEnvironment } from "hardhat/types";
export declare class LocalChainManager {
    pid: number | undefined;
    hre: HardhatRuntimeEnvironment;
    constructor(hre: HardhatRuntimeEnvironment);
    start(): Promise<void>;
    stop(): Promise<void>;
    private startChain;
    private deployContracts;
}
//# sourceMappingURL=LocalChainManager.d.ts.map