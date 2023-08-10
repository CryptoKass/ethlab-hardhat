# EthLab Hardhat Plugin

This plugin can be used to track realtime contract deployments.

EthLab can listen to the local chain for contract deployments, attempt to match them with the ABIs
of your contracts, and finally save that deployment
information to a `contracts.data.json`.

Requires ethers. (ethers.js)

## Installation

To start working on your project, just run

```bash
npm install --save-dev hardhat-ethlab
```

## Required plugins

- [@nomicfoundation/hardhat-ethers](https://github.com/nomiclabs/hardhat/tree/master/packages/hardhat-ethers)

## Configuration

<_A description of each extension to the HardhatConfig or to its fields_>

This plugin extends the `HardhatUserConfig`'s `ProjectPathsUserConfig` object with an optional
path: `ethlabOutput`. Most of the time this path should point to the assets directory in your ethlab-ui directory.

This is an example of how to set it:

```js
module.exports = {
  paths: {
    ethlabOutput: "./ethlab",
  },
};
```
