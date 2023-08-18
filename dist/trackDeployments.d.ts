import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { JsonRpcProvider } from "ethers";
type Contract4Bytes = Record<string, string>;
interface ContractsData {
    deployments: DeploymentInfo[];
    interfaces: Record<string, ContractArtifact>;
}
interface ContractArtifact {
    contractName: string;
    sourceName: string;
    abi: any;
    bytecode: string;
    deployedBytecode: string;
    linkReferences: any;
    deployedLinkReferences: any;
}
interface DeploymentInfo {
    address: string;
    contractName: string;
    blockNumber: number;
}
/** trackDeployments
 * tracks all the contract deployments by listening to new blocks
 * @param hre HardhatRuntimeEnvironment
 * */
export declare const trackDeployments: (hre: HardhatRuntimeEnvironment) => Promise<void>;
export declare const trackDeploymentsFromBlock: (hre: HardhatRuntimeEnvironment, provider: JsonRpcProvider, contractsData: ContractsData, registry: Contract4Bytes, contractArtifacts: ContractArtifact[], blockNumber: number) => Promise<void>;
export declare const _register4byte: (ContractArtifact: ContractArtifact, registry: Contract4Bytes) => Promise<void>;
export {};
//# sourceMappingURL=trackDeployments.d.ts.map