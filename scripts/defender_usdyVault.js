const { ethers } = require("ethers");
const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');

// Inline ABI of the contract we'll be interacting with (check out the rollup example for a better way to handle this!)
// const trigger_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"inputs":[],"name":"Admin","outputs":[{"internalType":"contract IAdmin","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"BalanceOfPOL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"LastBackedPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"OPERATOR_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"POL_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"RebalanceStartTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"balanceOfPOL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_Admin","type":"address"},{"internalType":"uint256","name":"updateInterval","type":"uint256"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"interval","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastBackedPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastTimeStamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"reBalancePool","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"rebalanceStartTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"resetReBalanceEpochTime","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_interval","type":"uint256"}],"name":"setInterval","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_reBalancePercentage","type":"uint256"}],"name":"setReBalanceValues","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]
const usdyVault_ABI = [{"inputs": [],"name": "reBaseRewards","outputs": [],"stateMutability": "nonpayable","type": "function"}]
const admin_ABI = [{"inputs": [],"name": "updateBuyBack","outputs": [],"stateMutability": "nonpayable","type": "function"},{"inputs": [],"name": "setLastEpoch","outputs": [],"stateMutability": "nonpayable","type": "function"}]
const balancer_ABI = [{"inputs": [],"name": "defenderRebalancer","outputs": [],"stateMutability": "nonpayable","type": "function"}]
// Main function, exported separately for testing
exports.main = async function(signer, usdyVaultContract, adminContract, usdyBUSDRebalancer) {
  // Create contract instance from the relayer signer
  const usdyvault = new ethers.Contract(usdyVaultContract, usdyVault_ABI, signer);
  const admin = new ethers.Contract(adminContract,admin_ABI,signer);
  const balancer = new ethers.Contract(usdyBUSDRebalancer,balancer_ABI, signer);

//   const tx = await trigger.reBalancePool();
  await usdyvault.reBaseRewards();
  await admin.setLastEpoch();
  await admin.updateBuyBack();
  await balancer.defenderRebalancer();
  return;

}

// Entrypoint for the Autotask
exports.handler = async function(credentials) {
  // Initialize defender relayer provider and signer
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
  const usdyVaultContract = '0x9a3ACce4517BF2D783aB009B93Da4c9EC0CEAC49';
  const adminContract = '0xa0993689cCfbB447faEde83eab96F42104aaFdD2';
  const usdyBUSDRebalancer = '0x7CaaA58B7ecCCA0607eB7601613724EA781Fca63'; 
  return exports.main(signer, usdyVaultContract, adminContract, usdyBUSDRebalancer); // Send funds to self
}

// To run locally (this code will not be executed in Autotasks)
if (require.main === module) {
  require('dotenv').config();
  const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env;
  exports.handler({ apiKey, apiSecret })
    .then(() => process.exit(0))
    .catch(error => { console.error(error); process.exit(1); });
}