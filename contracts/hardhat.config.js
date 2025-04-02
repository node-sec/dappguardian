require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {},
    // Add other networks as needed
    sepolia: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY].filter(Boolean)
    }
  }
}; 