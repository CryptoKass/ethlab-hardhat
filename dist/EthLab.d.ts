import "./type-extensions";
import { Contract, ContractMethodArgs } from "ethers";
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
export declare class EthLab {
    hre: HardhatRuntimeEnvironment;
    contracts: Record<string, ContractInfo>;
    deploymentInfo: DeploymentInfo[];
    constructor(hre: HardhatRuntimeEnvironment);
    registerABI(name: string, abi: string): Promise<void>;
    registerContract(name: string, contract: Contract): Promise<void>;
    deployContract(name: string, args?: ContractMethodArgs<any[]>): Promise<Contract>;
    private save;
}
export {};
//# sourceMappingURL=EthLab.d.ts.map