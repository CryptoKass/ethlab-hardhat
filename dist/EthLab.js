"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthLab = void 0;
require("./type-extensions");
const fs_1 = __importDefault(require("fs"));
class EthLab {
    constructor(hre) {
        this.contracts = {};
        this.deploymentInfo = [];
        process.on("exit", () => this.save());
        this.hre = hre;
    }
    async registerABI(name, abi) {
        this.contracts[name] = {
            name,
            abi,
        };
    }
    async registerContract(name, contract) {
        // save contract info
        this.registerABI(name, contract.interface.formatJson());
        const tx = contract.deploymentTransaction();
        // save deployment info
        this.deploymentInfo.push({
            name,
            block: (tx === null || tx === void 0 ? void 0 : tx.blockNumber) || 0,
            tx: (tx === null || tx === void 0 ? void 0 : tx.hash) || "",
            address: await contract.getAddress(),
        });
        console.log(`ethlab: Registered contract ${name} at ${await contract.getAddress()}`);
    }
    async deployContract(name, args = []) {
        const factory = await this.hre.ethers.getContractFactory(name);
        const contract = await factory.deploy(...args);
        await contract.deployed();
        await this.registerContract(name, contract);
        return contract;
    }
    save() {
        const config = this.hre.config;
        const contractsPath = config.paths.ethlabPath + "/contracts.json";
        const deploymentsPath = config.paths.ethlabPath + "/deployments.json";
        // 1. save contracts
        fs_1.default.writeFileSync(contractsPath, JSON.stringify(this.contracts, null, 2));
        console.log(`ethlab: Saved contract info '${contractsPath}'`);
        // 2. sort deployment info by block number
        this.deploymentInfo.sort((a, b) => a.block - b.block);
        // 3. save deployment info
        fs_1.default.writeFileSync(deploymentsPath, JSON.stringify(this.deploymentInfo, null, 2));
        console.log(`ethlab: Saved deployment info '${deploymentsPath}'`);
    }
}
exports.EthLab = EthLab;
//# sourceMappingURL=EthLab.js.map