"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const path_1 = __importDefault(require("path"));
require("./type-extensions");
const config_2 = require("hardhat/config");
const ethers_1 = require("ethers");
const trackDeployments_1 = require("./trackDeployments");
(0, config_1.extendConfig)((config, userConfig) => {
    var _a;
    // add ethlabOutput to config
    const userPath = (_a = userConfig.paths) === null || _a === void 0 ? void 0 : _a.ethlabOutput;
    let ethlabOutput;
    if (userPath === undefined) {
        ethlabOutput = config.paths.artifacts;
    }
    else {
        if (path_1.default.isAbsolute(userPath))
            ethlabOutput = userPath;
        else
            ethlabOutput = path_1.default.normalize(path_1.default.join(config.paths.root, userPath));
    }
    config.paths.ethlabOutput = ethlabOutput;
});
(0, config_2.task)("ethlab:watcher", "Track contract deployments").setAction(async (args, hre) => {
    (0, trackDeployments_1.trackDeployments)(hre);
    await new Promise(() => { }); // wait forever
});
(0, config_2.task)("ethlab:start", "Deploy contracts").setAction(async (args, hre) => {
    console.log("\n\n[ethlab:start] 🧪 STARTING LOCAL NODE 🧪");
    hre.run("node");
    // wait for connection.
    await _isChainAlive();
    hre.hardhatArguments.network = "localhost";
    hre.network.name = "localhost";
    console.log("\n\n[ethlab:start] 🧪 STARTING WATCHER 🧪");
    hre.run("ethlab:watcher");
    console.log("\n\n[ethlab:start] 🧪 DEPLOYING CONTRACTS 🧪");
    await hre.run("run", {
        script: "scripts/deploy.ts",
        network: "localhost",
    });
    await new Promise(() => { }); // wait forever
});
const _isChainAlive = () => {
    const rpc = new ethers_1.JsonRpcProvider("http://127.0.0.1:8545/");
    return new Promise((resolve, reject) => {
        let maxAttempts = 20;
        const checkInterval = setInterval(() => {
            rpc
                .getNetwork()
                .then(() => resolve(clearInterval(checkInterval)))
                .catch(() => { });
            if (maxAttempts-- === 0) {
                clearInterval(checkInterval);
                reject(new Error("Could not connect to local chain"));
            }
        }, 1000);
    }).finally(() => rpc.destroy());
};
//# sourceMappingURL=index.js.map