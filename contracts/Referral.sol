//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "./Interfaces/IAdmin.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./Interfaces/IEvents.sol";

contract Referral is Initializable, AccessControl, ReentrancyGuard, IEvents {
    IERC20 public token;
    IAdmin public Admin;
    uint256 public expiryDate;
    uint public percentage;
    uint[3] public referrerPercentage; // multiply by 10 coff value

    bytes32 public constant REWARD_ROLE = keccak256("REWARD_ROLE");
    struct User {
        uint lockPeriod;
        uint totalReferralReward;
        address referrer;
    }
    mapping(address => User) public users;
    mapping(address => bool) public isExist;

    function initialize(IERC20 _token, IAdmin _admin) external initializer {
        token = IERC20(_token);
        Admin = IAdmin(_admin); 
        isExist[Admin.TeamAddress()] = true;
        _grantRole(REWARD_ROLE, Admin.swapPage());
        _grantRole(REWARD_ROLE, Admin.USDy());
        _grantRole(REWARD_ROLE, Admin.POL());
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        isExist[Admin.TeamAddress()] = true;
        referrerPercentage = [40,30,20];
        expiryDate = 30 days;
        percentage = 30;
    }

    modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;  
    }



/**            
@dev this function sets the reward percentages
@param user address of user
@param amount reward distribution ratio multiply by 10 coff. value
 */
    function Reward_Percentage( address user,  uint128[3] memory amount) public nonReentrant _isAdmin {
        referrerPercentage = amount;
        emit RewardPercentage("ReferralNFT",user,amount,block.number, block.timestamp);
    }
/**
@dev this function distribute reward for the user
@param user address of user
@param _reward reward to be distributed
 */
    function rewardDistribution(address user, uint _reward, uint volume) public nonReentrant onlyRole(REWARD_ROLE) returns(uint amount, uint leftAmount) {   
        address userReferrer = users[user].referrer;
        leftAmount = _reward;
        for(uint i = 1; i <= 3; i++){
            if(userReferrer != address(0)){
                if(users[userReferrer].totalReferralReward == 0){
                    users[userReferrer].lockPeriod = block.timestamp;
                }else if(users[userReferrer].lockPeriod + expiryDate < block.timestamp){

                    token.transfer(Admin.TeamAddress() , users[userReferrer].totalReferralReward); //price as variable
                    users[userReferrer].totalReferralReward = 0;
                }
                users[userReferrer].totalReferralReward += (volume * referrerPercentage[i-1])/1000;
                leftAmount -= (volume * referrerPercentage[i-1])/1000;
                emit Reward_Earning(user,userReferrer,(volume * referrerPercentage[i-1])/1000,i,volume, block.number, block.timestamp);
            }else{
                emit Reward_Earning(user,Admin.TeamAddress(),(volume * referrerPercentage[i-1])/1000,i,volume, block.number, block.timestamp);

            }
                userReferrer = users[userReferrer].referrer;
        }
        return (_reward - leftAmount, leftAmount);
    }
/**
@dev this function is used to claim reward
 */
    function claimReward() public nonReentrant{
        require(users[msg.sender].totalReferralReward != 0,"ReferralNft: nothing to claim");
        if(users[msg.sender].lockPeriod + expiryDate < block.timestamp){
            token.transfer(Admin.TeamAddress() , users[msg.sender].totalReferralReward); //price as variable
        }else{
            token.transfer(Admin.TeamAddress() , (users[msg.sender].totalReferralReward) * percentage / 100); //price as variable
            token.transfer(msg.sender, (users[msg.sender].totalReferralReward) * (100 - percentage) / 100);
        }
        users[msg.sender].totalReferralReward = 0;
        emit ReferralEarned(msg.sender, block.number, block.timestamp);
    }

    function setPercentage(uint _percentage) external{
        require(_percentage!=0,"ReferralNFT:price cannot be zero");
        emit SetterForUint("ReferralNFT",address(this), percentage, _percentage,block.number,block.timestamp);
        percentage = _percentage;
    }


/**
@dev this function sets referral accounts from user
@param referrer reffered address
 */
    function setReferrer(address referrer) public {
        require(referrer != msg.sender, "ReferralNft: User adress not equals to referrer address");
        require(msg.sender != Admin.TeamAddress(),"ReferralNft: can't be team adress");
        require(!isExist[msg.sender],"ReferralNft: User already exist");
        require(isExist[referrer],"ReferralNft: Referrer not exist");
        require(users[msg.sender].referrer ==  address(0), "ReferralNft: already referred");
        emit SetterForReferrer(msg.sender,referrer,block.number,block.timestamp);
        
        if(referrer != Admin.TeamAddress()){
            users[msg.sender].referrer = referrer;
        }
        isExist[msg.sender] = true;
    }

    function setExpiryDate(uint256 date) public _isAdmin{
        require(date != 0);
        expiryDate = date;
    }
/**
@dev this function get all referrer address that a user has referred
@param from addresss user
 */
    function getReferrer(address from) public view returns(address) {
        return users[from].referrer;
    }

    function getEarning(address from) public view returns(uint) {
        return users[from].totalReferralReward;
    }

    //todo require check for caller
    function recoverDeadBalance(address[] calldata _users) external{
        for(uint i =0; i <= _users.length; i++){
            if((users[_users[i]].lockPeriod + expiryDate < block.timestamp) && (users[_users[i]].totalReferralReward != 0)){
                token.transfer(Admin.TeamAddress() , users[_users[i]].totalReferralReward); //price as variable
            }
        }
    }

    function Users(address user) public view returns(uint,uint,address){
        return (users[user].lockPeriod,users[user].totalReferralReward,users[user].referrer);
    }
    
    function setRole(address _roleTo) external _isAdmin {
        require(_roleTo != address(0), "Referral : Null address provided");
        _setupRole(REWARD_ROLE, _roleTo);
    }

    function setAdmin(address _admin) external _isAdmin{
        Admin = IAdmin(_admin);
    }
}