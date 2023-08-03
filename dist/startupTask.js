"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startupTask = void 0;
const startupTask = async (hre) => {
    // start local chain
    console.log("ethlab: Startup – Starting local chain...");
    await _startLocalChain(hre);
    // deploy contracts
    console.log("ethlab: Startup – Deploying contracts...");
    await _deployContracts(hre);
    console.log("ethlab: Startup – Done!");
    // stay alive
    await new Promise(() => { });
};
exports.startupTask = startupTask;
const _startLocalChain = (hre) => {
    return new Promise((resolve, reject) => {
        hre.run("node").catch((err) => reject(err));
        // check the node is running
        const checkInterval = setInterval(() => {
            hre.ethers.provider
                .getNetwork()
                .then(() => resolve(clearInterval(checkInterval)))
                .catch(() => { });
        }, 1000);
    });
};
const _deployContracts = async (hre) => {
    await hre.run("run", { script: "scripts/deploy.ts", network: "localhost" });
};
//# sourceMappingURL=startupTask.js.map