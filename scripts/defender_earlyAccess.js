const { ethers } = require("ethers");
const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');

// Inline ABI of the contract we'll be interacting with (check out the rollup example for a better way to handle this!)
const earlyAccess_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_Admin",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "busdCollected",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "BUSDcollected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "BiddingNFT",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "counter",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "lockPeriod",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "Buy",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "vault",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "CalculateAPR",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "wonAddress",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "ClaimBID",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "vault",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "ControllerFee",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "Vault",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "Deposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "rank",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "TopofAuction",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "EndAuction",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "Vault",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "LottoDeposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isLptoken",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isAuto",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "smartchef",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "strat",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "instance",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "OptAdd",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "vault",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "OptAddCustomVaults",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "Vault",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "level",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "OptDeposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "pid",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint32[]",
        "name": "number",
        "type": "uint32[]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "OptMultiplier",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32[]",
        "name": "multiplier",
        "type": "uint32[]"
      },
      {
        "indexed": false,
        "internalType": "uint32[]",
        "name": "deductionValue",
        "type": "uint32[]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "OptMultiplierLevel",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "optvault",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "OptimizationRewards",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "Vault",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "Optwithdraw",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "Vault",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "PurchaseORSell",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "userTokenID",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "ReactivateNFT",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "ReferralEarned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "highestbid",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "winnerofTokenID",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "biddingArray",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "ResetNewAuction",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "TotalRewardPercentage",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "UserReferrer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "Leftamount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "RewardDistribute",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint128[3]",
        "name": "amount",
        "type": "uint128[3]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "RewardPercentage",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "beneficiary",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "level",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "volume",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "Reward_Earning",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "previousAdminRole",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "newAdminRole",
        "type": "bytes32"
      }
    ],
    "name": "RoleAdminChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "contractAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "previousAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "currentAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "SetterForAddress",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "contractAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "level",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "multiplierLevel",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "SetterForMultiplierLevel",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "contractAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256[3]",
        "name": "previousArray",
        "type": "uint256[3]"
      },
      {
        "indexed": false,
        "internalType": "uint256[3]",
        "name": "currentArray",
        "type": "uint256[3]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "SetterForOptimizationTaxFee",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "RefferAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "SetterForReferrer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "contractAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "previousValue",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "currentValue",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "SetterForUint",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "contractAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "previousTax",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "currentTax",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "perviousAllocationTax",
        "type": "uint256[]"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "currentAllocationTax",
        "type": "uint256[]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "TaxAllocation",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "Vault",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocknumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "Withdraw",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "Admin",
    "outputs": [
      {
        "internalType": "contract IAdmin",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "Bidding",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ClaimBid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "MintTimestamp",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "OPERATOR_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "RankRegistered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "TopOfTheAuction",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "Won",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "biddingNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buffer",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "duration",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "endTheAuction",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "flag",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "flagReturn",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      }
    ],
    "name": "getRoleAdmin",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "hasRole",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "highestBid",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "highestBidder",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "time",
        "type": "uint256"
      }
    ],
    "name": "setDuration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_startTime",
        "type": "uint256"
      }
    ],
    "name": "setStartTime",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_top",
        "type": "uint256"
      }
    ],
    "name": "setTop",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "top",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "top24",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
// Main function, exported separately for testing
exports.main = async function(signer, contractAddress) {
  // Create contract instance from the relayer signer
  const earlyAccess = new ethers.Contract(contractAddress, earlyAccess_ABI, signer);

  if(await earlyAccess.flagReturn()){
    const tx = await earlyAccess.endTheAuction();
    return tx;
  }
  return;
}

// Entrypoint for the Autotask
exports.handler = async function(credentials) {
  // Initialize defender relayer provider and signer
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
  const contractAddress = '0xE956E478832f754B17E374C50852B95D353ac429'; // Rinkeby DAI contract
  return exports.main(signer, contractAddress); // Send funds to self
}

// To run locally (this code will not be executed in Autotasks)
if (require.main === module) {
  require('dotenv').config();
  const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env;
  exports.handler({ apiKey, apiSecret })
    .then(() => process.exit(0))
    .catch(error => { console.error(error); process.exit(1); });
}