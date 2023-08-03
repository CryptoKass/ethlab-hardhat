"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalChainManager = void 0;
const child_process_1 = require("child_process");
const tree_kill_1 = __importDefault(require("tree-kill"));
const ethers_1 = require("ethers");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class LocalChainManager {
    constructor(hre) {
        this.hre = hre;
        process.on("exit", () => this.stop());
    }
    async start() {
        console.log("ethlab: Starting local chain...");
        await this.startChain();
        console.log(`ethlab: Started local chain with PID '${this.pid}'`);
        console.log("ethlab: Deploying contracts to local chain...");
        await this.deployContracts();
        console.log("ethlab: Deployed contracts to local chain");
    }
    stop() {
        return new Promise((resolve, reject) => {
            if (this.pid === undefined)
                return resolve();
            (0, tree_kill_1.default)(this.pid, (err) => {
                if (err)
                    return reject(err);
                console.log(`ethlab: Stopped local chain with PID '${this.pid}'`);
                resolve();
            });
        });
    }
    startChain() {
        return new Promise((resolve, reject) => {
            const instance = (0, child_process_1.spawn)("npx", ["hardhat", "node"]);
            instance.stdout.on("data", (data) => {
                console.log(`chain: ${data}`);
            });
            instance.stderr.on("data", (data) => {
                console.error(`chain: ${data}`);
            });
            instance.on("close", (code) => {
                console.log(`chain: exited with code ${code}`);
                reject(new Error("Local chain exited"));
            });
            this.pid = instance.pid;
            // check the node is running
            let maxAttempts = 20;
            const checkInterval = setInterval(() => {
                new ethers_1.JsonRpcProvider("http://127.0.0.1:8545/")
                    .getNetwork()
                    .then(() => resolve(clearInterval(checkInterval)))
                    .catch(() => { });
                if (maxAttempts-- === 0) {
                    clearInterval(checkInterval);
                    reject(new Error("Could not connect to local chain"));
                }
            }, 1000);
        });
    }
    async deployContracts() {
        await this.hre.run("run", {
            script: "scripts/deploy.ts",
            network: "localhost",
        });
        // open the file: contracts.json and
        // deployments.json files and read the contents
        // into memory
        const contractsPath = path_1.default.join(this.hre.config.paths.ethlabPath, "./contracts.json");
        const contracts = JSON.parse(fs_1.default.readFileSync(contractsPath).toString());
        const deploymentsPath = path_1.default.join(this.hre.config.paths.ethlabPath, "./deployments.json");
        const deployments = JSON.parse(fs_1.default.readFileSync(deploymentsPath).toString());
        this.hre.ethlab.contracts = contracts;
        this.hre.ethlab.deploymentInfo = deployments;
    }
}
exports.LocalChainManager = LocalChainManager;
//# sourceMappingURL=LocalChainManager.js.map