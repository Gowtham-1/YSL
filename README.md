# Project Name : YSL 

> This is a custom-build DeFI protocol that supports the core pillars of Yield, Staking and Liquidity. This project holds its customised Tokens , Vaults and NFT's. 

# Technology Used
## Language we used : 
> Solidity,It is an object-oriented programming language created specifically by the Ethereum Network team for constructing and designing smart contracts on Blockchain platforms. It's used to create smart contracts that implement business logic and generate a chain of transaction records in the blockchain system. 

> JavaScript,  is a scripting language that enables you to create dynamically updating content. In this project we have used JS for deploying the contracts. 

> TypeScript, Adds optional types to JavaScript that support tools for large-scale JavaScript applications.TypeScript compiles to readable, standards-based JavaScript. In this project we have used TS for Unit Testing on Hardhat.
# Project Setup
Log in to GitLab, take a clone from the repository, and copy the URL. Then, open Visual Studio, go to the terminal run command :
> git clone and paste the URL with it. 

## Install dependencies
> npm install or  npm i : NPM is a node package manager. It is basically used for managing dependencies of various server side dependencies. 


### Customize .env file

Give your account mnemonic in TESTNET_MNEMONIC \
Give your etherscan api key for rinkeby in ETHERSCAN_API_FOR_RINKEBY. You can create it from [here](https://etherscan.io/). Its important for verification. \
Give your alchemy api key in ALCHEMY_API_KEY.Get it from [here](https://auth.alchemyapi.io/).\
Give your ethersacn api key for bscscan in ETHERSCAN_API_FOR_TESTNET. You can create it from [here](https://bscscan.com/myapikey). Its important for verification.

## Gas Reporter

Gas reporter can be enabled or disabled by setting gasReporter to true or false in hardhat.config.ts.

## Compile
> npx hardhat compile : Command used for compiling the  possible set of files at a time.


## Run tests
> npx hardhat test : Command used for testing the file or a particular function, to make sure that the actual output is equal to the expected output or not.

## Clean artifacts and cache
> npx hardhat clean: Command used for cleaning the Artifacts and Cache simultaneously. 
> To re-create it use command : 
            >npx hardhat compile 
and run it.

## Deploy script
> Command for deploying  : npx hardhat run  scripts/<scriptName> --network <networkType>

### For bscscan

```bash
npx hardhat run --network testnet  scripts/deploy.ts
```

### For local

```bash
npx hardhat run --network localhost  scripts/deploy.ts
```

### For others you can refer hardhat docs [here](https://forum.openzeppelin.com/t/verify-smart-contract-inheriting-from-openzeppelin-contracts/4119)

## Verify script

Replace the address with your deployed contract,replace constructor arguments with your contract constructor arguments,then in contracts give the path to your main solidity file and then your contract name in verify.ts file.

Note : Make sure to run the verify script after 2min of deployment either you can get an error.

Command for Verifing Tokens : npx hardhat run  scripts/<scriptName> --network <networkType>

### For bscscan

```bash
npx hardhat run --network testnet  scripts/verify.ts
```
# Custom Tokens
Customary  features of each token to be Presuppose are:

> Transfer function, has Transaction TimeLimit, for a non - whitelist user, i.e user can only interact once within 24 hours, either receive or transfer. 

 > Another limitation for non - whitelist user is Block Restriction, states that the user can only have 1 transaction within same block.

 > User must provide valid amount and address, Invalid amount or null address is restricted. 

 > In case, if a user or any contract is blacklisted then the blacklisted user or contract can't interact with the platform.

 > If the contract or User is Whitelisted then the user is excluded from tax deduction, Block restrictions and Transaction TimeLimit.

 > The check of Liquidity Pool in the transfer function ensures the existence of the particular token paired with any another token of the specific address i.e of router provided as a parameter, Which returns a bool(true,false).,where true impiles the existence of the pair and false impiles the non-existence of the pair. Further, presume a particular token is paired with multiple tokens than the trade tax is to be applied on them. 

 > The next check, Price Impact Protection in the transfer function helps with reverting the transaction if the Amount of transfer impacts the pool price of the particular paired token.For instance: If the price of YSL in YSL-BUSD pool is reduced more than the threshold Percentage(Which can only be set by the Admin/Operator), Then the transaction gets reverted.

 > The Exit Rate functionality in the token, restricts the User from transferring more than a particular Percentage of amount derived from the Number of days User holds the token.After 102 days User can transfer 100% of the amount he holds in the wallet.But, on the day 1 or day 2 of owning the token, if the user transfers more than 0.1 % of the tokens he holds the exit rate will be reset again to 102 days. after 2 days of holding the token, user can transfer only upto 1 % per day.    

 > Irrespective to the Exit rate, if a User deposits in its respective vault with the amount which is less than he holds in his Wallet, then he is restricted from transferring more than his deposits even after 102 days of holding that specific tokens.    

 > If USDy is in the state of Below Peg,then the Buy Back Activation is set to be true automatically for 24 hours. 

 > In case if Buy-Back Activation is set to be False, just in condition  of Above Peg.,A transaction is made by the non-whitelist user, 15% of the tax is deducted out of which 5% of it is burned after swapping it to USDy. Next 5% is sent to Team Address, Remaining 5% is sent to Treasury Address.

 > The Buy- Back Activation is set to be True by the Admin, in case of Below Peg. Then the 25% of the transaction is sent to the Team Address.Rest 75% of the transaction is swapped in BUSD and then, to the USDy. After swapping, the USDy's are burned.All burned tokens are sent to a dead address, meaning they are officially taken out of circulation – leaving the supply reduced by the amount burned.

## YSL 
This token is termed as protocols governance token. Where, the governance token implies that the holders are benifited with Voting Rights. 

### Technical functionality of YSL Tokens :
Being a governance token, its core functionality involves:
 > Airdrop,which is based on Snapshot,SnapShot refers to the ability to record the state of a computer system or storage device at a specific point in time. In cryptocurrencies, a snapshot is often describing the act of recording the state of a blockchain on a particular block height. In this case, the snapshot records the contents of the entire blockchain ledger, which includes all existing addresses and their associated data.

 Snapshots are commonly used during airdrops events before each round takes place. During an airdrop, tokens are distributed based on the balance of each blockchain address. In this case, snapshots are taken to record the balance of each token holder via our Node service , at a specific point in time (i.e., block height). In most cases, users can move their funds after the snapshot is taken, without compromising their eligibility to participate in that round of distribution.

 The Airdrop of YSL token has the feature of increasing the Ratio of the YSL Vault,as the remaining claim Amount of Airdrop is transferred to YSL Vault.

 > Every transaction of YSL will be subject to the 15% transaction tax, including when the protocol performs a buy-back every 8 hours.The 10% of this tax will be sent to Temporary Holding, rest 5% will be sent to Treasury.

## xYSL
xYSL is a hyper-deflationary token with a unique burning mechanism that has been integrated into our ecosystem. 
### Technical functionality of XYSL Tokens :
Being a deflationary token, its core functionality involves:
 
 > A significant advantage that xYSL has over all other deflationary tokens in the market today. Even if not a single xYSL token is traded on the market, you can rest assured that there will still be a significant amount of the xYSL being purchased and burned by the protocol on a daily basis, which will contribute to an ever-increasing price.

 ## bYSL
bYSL is a protocol-specific token that benifits with an opportunity for users to share in the success of our protocol through the growth of treasury, as the balance of BUSD held by our treasury increases, so too will the value of your bYSL. 
### Technical functionality of bYSL Tokens :
> 
## USDy
USDy has a vital role within the ecosystem as the protocols reward token.
### Technical functionality of USDy Tokens :
> Every transaction of USDy will be subject to the 30% transaction tax, The 10% of this tax will be sent to Referal Contract, 10% will be sent to Treasury and remaining is sent to Team Address.
## xBUSD
### Technical functionality of xBUSD Tokens :

## BSHARE
BSHARE is a utility token that facilitate the growth of our platform. 
### Technical functionality of BSHARE Tokens :
 > Every transaction of BSHARE will be subject to the 15% transaction tax, The 10% of this tax will be sent to BShareBUSDVault, rest 5% will be sent to Treasury.

# Custom Vaults and LP Vaults
Customary features of each Vault to be Presuppose are:

 > Limitation for Non - Whitelist users is Block Restriction, states that the user can only have 1 transaction within same block.

 > Any external contract can't interact with the protocol.Therefore, the Contract must be Whitelisted for any interaction within the protocol.

 > User must provide valid amount and address, Invalid amount or null address is restricted. 

 > If the contract or User is Whitelisted then the user is excluded from tax deduction, and Block restrictions.

 > Admin can completely pause the Vault, therefore the User can't made any future deposits, withdrawals and rewards to the Vault.

 > In case, if a user or any contract is blacklisted then the blacklisted user or contract can't interact with the platform.

 > Emergency Withdrawal is performed by the Admin, in situation of DDoS attack or a temporary outage, users can still withdraw their tokens by interacting directly with the vault contract this should trigger the Liquidity Rebalancer. However, If the liquidity rebalancer fails to get triggered during this emergency withdrawal, the user will receive back their BUSD based on their share of the LP tokens.

 ## BUSD Vault
 > User can only deposit BUSD token in BUSD vault.

 > User deposits or withdraws from the BUSD vault,but they can only withdraw after 4 epochs from their last deposit or withdrawal.

 > There is 0% tax on transaction of deposit and withdrawal. Therefore, 100% of BUSD-S, the receipt token is minted for the user to represent their share in the vault.

 > 100% of the BUSD is paired with USDy (minted) and added as liquidity onto ApeSwap.

 > At the time of Withdrawal from the BUSD vault, the liquidity of USDy-BUSD is removed 2 times of withdrawal amount,with the USDy being burnt and the BUSD side of the liquidity being sent to the user's wallet address. The BUSDs receipt token gets immediately burnt. 

 > If the USDy-BUSD pool price is trading below the Maximum Buyback Percentage that was set on the Liquidity Rebalancer contract by the admin, then the withdrawals from the BUSD vault will need to be disabled till the Liquidity Rebalancer can perform the required actions to keep the pool price of USDy-BUSD at the peg.

 > After hitting the RebaseReward by the Admin, Users can claim their rewards.
## USDy Vault

 > Only the USDy token can be deposited into the vault.

 > User can only withdraw USDy token from the USDyVault.

 > 10% will be taken from every deposit and withdrawal as a fee that will go towards increasing the ratio of the USDy vault.

 > At the end of each 8-hour epoch, the protocol will mint 0.2% of the total amount of USDy that's staked within the USDy vault. These minted USDy will be sent to the vault to increase the ratio of the vault.

 > Withdrawals from the USDy vault should get reverted when the USDy Buyback and Burn function is activated.

 # Custom LPVaults
Customary  features of each LP Vault to be Presuppose are:

> Only the BUSD token can be deposited into the vault.

> Only the USDy token can be withdrawn from the vault.

> Withdrawals from the LP vault should get reverted when the USDy Buyback and Burn function is activated.


## BSHARE-BUSD Vault

> 10% will be taken from every deposit as a fee that will go towards increasing the ratio of the BSHARE-BUSD vault.

> At the end of each 8-hour epoch, the protocol will mint 0.1% of the total amount of USDy that's staked within the USDy vault. These minted USDy will be sent to the BSHARE-BUSD vault as claimable rewards.

## USDy-BUSD Vault
 > 5% will be taken from every deposit as a fee that will go towards increasing the ratio of the USDy-BUSD vault.

 > At the end of each 8-hour epoch, the protocol will mint 0.2% of the total amount of USDy that's staked within the USDy vault. These minted USDy will be sent to the USDy-BUSD vault as claimable rewards.

## YSL-BUSD Vault
 > 10% will be taken from every deposit as a fee that will go towards increasing the ratio of the YSL-BUSD vault.

 > At the end of each 8-hour epoch the protocol will mint 0.1% of total amount of USDy thats staked within the USDy vault. These minted USDy will be sent to the YSL-BUSD vault as claimable rewards.

## xYSL-BUSD Vault
> 10% will be taken from every deposit as a fee that will go towards increasing the ratio of the xYSL-BUSD vault.

> At the end of each 8-hour epoch, the protocol will mint 0.1% of the total amount of USDy that's staked within the USDy vault. These minted USDy will be sent to the xYSL-BUSD vault as claimable rewards.
