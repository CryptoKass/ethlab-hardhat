"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const plugins_1 = require("hardhat/plugins");
const path_1 = __importDefault(require("path"));
const EthLab_1 = require("./EthLab");
require("./type-extensions");
(0, config_1.extendConfig)((config, userConfig) => {
    var _a;
    // add ethlabPath to config
    const userPath = (_a = userConfig.paths) === null || _a === void 0 ? void 0 : _a.ethlabPath;
    let ethlabPath;
    if (userPath === undefined) {
        ethlabPath = path_1.default.join(config.paths.root, "./artifacts/ethlab");
    }
    else {
        if (path_1.default.isAbsolute(userPath))
            ethlabPath = userPath;
        else
            ethlabPath = path_1.default.normalize(path_1.default.join(config.paths.root, userPath));
    }
    config.paths.ethlabPath = ethlabPath;
});
(0, config_1.extendEnvironment)((hre) => {
    hre.ethlab = (0, plugins_1.lazyObject)(() => new EthLab_1.EthLab(hre));
});
//# sourceMappingURL=index.js.map