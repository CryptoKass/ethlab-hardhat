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
        this.hre = hre;
        process.on("exit", () => this.save());
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
        const contract = (await factory.deploy(...args));
        await contract.waitForDeployment();
        await this.registerContract(name, contract);
        return contract;
    }
    async _registerExternalDeployment(name, address) {
        // 1. ensure abi exists for this contract
        if (!this.contracts[name])
            throw new Error(`ethlab: No ABI registered for contract '${name}'`);
        // 2. get deployment transaction
        const contract = await this.hre.ethers.getContractAt(this.contracts[name].abi, address);
        const tx = await contract.deploymentTransaction();
        // 3. save deployment info
        this.deploymentInfo.push({
            name,
            block: (tx === null || tx === void 0 ? void 0 : tx.blockNumber) || 0,
            tx: (tx === null || tx === void 0 ? void 0 : tx.hash) || "",
            address: await contract.getAddress(),
        });
    }
    clear() {
        this.contracts = {};
        this.deploymentInfo = [];
    }
    save() {
        if (Object.values(this.contracts).length === 0 &&
            this.deploymentInfo.length === 0)
            return console.log("ethlab: No contracts to save");
        console.log("ethlab: Saving contracts and deployment info");
        const config = this.hre.config;
        const contractsPath = config.paths.ethlabPath + "/contracts.json";
        const deploymentsPath = config.paths.ethlabPath + "/deployments.json";
        // 0. ensure ethlabPath exists (create if not)
        if (!fs_1.default.existsSync(config.paths.ethlabPath))
            fs_1.default.mkdirSync(config.paths.ethlabPath, { recursive: true });
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