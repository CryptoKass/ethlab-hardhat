"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const express_1 = __importDefault(require("express"));
const LocalChainManager_1 = require("./LocalChainManager");
const createServer = async (hre, port = 1337) => {
    console.log("ethlab: Starting server");
    const app = (0, express_1.default)();
    const chainManager = new LocalChainManager_1.LocalChainManager(hre);
    // contracts ABIs
    app.get("/contracts", (_, res) => res.json(hre.ethlab.contracts));
    app.post("/contracts", async (req, res) => {
        const { name, abi } = req.body;
        await hre.ethlab.registerABI(name, abi);
        res.sendStatus(200);
    });
    // contract deployments
    app.get("/deployments", (_, res) => res.json(hre.ethlab.deploymentInfo));
    app.post("/deployments", async (req, res) => {
        const { name, address } = req.body;
        await hre.ethlab._registerExternalDeployment(name, address);
        res.sendStatus(200);
    });
    // chain
    app.post("/chain/restart", async (req, res) => {
        await chainManager.stop();
        await chainManager.start();
        res.sendStatus(200);
    });
    // misc
    app.get("/ping", (_, res) => res.sendStatus(200));
    console.log(`ethlab: starting to listen `);
    app.listen(port, () => {
        console.log(`ethlab: Server listening at http://localhost:${port}`);
        chainManager.start().catch((err) => console.error(err));
    });
    console.log(`ethlab: Server started`);
};
exports.createServer = createServer;
//# sourceMappingURL=server.js.map