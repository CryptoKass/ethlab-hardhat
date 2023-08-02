# EthLab Hardhat Plugin

This plugin can be used to register contracts and deployments with EthLab.

Requires ethers. (ethers.js)

## Installation

To start working on your project, just run

```bash
npm install --save-dev hardhat-ethlab
```

## Required plugins

- [@nomicfoundation/hardhat-ethers](https://github.com/nomiclabs/hardhat/tree/master/packages/hardhat-ethers)

## Environment extensions

This plugin extends the Hardhat Runtime Environment by adding an `ethlab` field whose type is `EthLab`.

## Configuration

<_A description of each extension to the HardhatConfig or to its fields_>

This plugin extends the `HardhatUserConfig`'s `ProjectPathsUserConfig` object with an optional
`ethlabPath` field that should point to your ethlab directory.

This is an example of how to set it:

```js
module.exports = {
  paths: {
    ethlabPath: "./ethlab",
  },
};
```

## Usage

### Registering a contract

Register your contracts with ethlab during deployment.

```ts
const MyContract = await ethers.getContractFactory("MyContract");
const myContract = await MyContract.deploy(["Hello, world!"]);
await myContract.deployed();

// register with ethlab
hre.ethlab.registerContract("MyContract", MyContract);
```

or your can use the short hand deploy function:

```ts
const myContract = await hre.ethlab.deploy("MyContract", ["Hello, world!"]);
```

---

### Registering an ABI

If you just want to make an abi available to ethlab, you can do that too:

```ts
const MyContract = await ethers.getContractFactory("MyContract");
hre.ethlab.registerAbi("MyContract", MyContract.interface.formatJSON());
```

(If have already registered contract with EthLab its abi will already be registered.)
