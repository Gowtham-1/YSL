// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./Interfaces/IEvents.sol";
import "./Interfaces/IAdmin.sol";
import "./Interfaces/ISwapPage.sol";

contract EarlyAccess is Initializable,AccessControl, ReentrancyGuard, IEvents{
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for minter role
    uint256 public top;
    uint256 public startTime;
    uint256 public duration;
    uint256 public highestBid;
    address public highestBidder;
    address[] public top24;
    bool public flag;

    mapping(address => uint256) public Bidding;
    mapping(uint256 => address) public TopOfTheAuction;
    mapping(address => uint256) public Won;
    mapping(address => bool) public RankRegistered;

    IAdmin public Admin;

    function initialize(address _Admin, uint _startTime) external initializer
    {
        Admin = IAdmin(_Admin);
        top = 24; //todo change to 24
        duration = 24 hours; //todo change to 24 hours
        startTime = _startTime;
    }


    modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    modifier _isAdminOrOperator(){
        require(Admin.hasRole(OPERATOR_ROLE, msg.sender) || Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    /**
    NOTE this function can only be called by the owner
    @dev this function ends the auction
    */

    function endTheAuction() external _isAdminOrOperator returns(bool){
        require(!flag , "EarlyAccessToken: Auction has ended");
        require(
            block.timestamp >=  startTime + duration,
            "EarlyAccessToken: Auction has not ended yet"
        );
        uint rank =1;
        for (uint i = 1; i <= top24.length ; i++) {
            if(RankRegistered[top24[top24.length - i]] != true){
                TopOfTheAuction[rank] = top24[top24.length - i];
                Won[top24[top24.length - i]] = rank;
                IERC20(IAdmin(Admin).BUSD()).transfer(IAdmin(Admin).TeamAddress(),Bidding[top24[top24.length - i]]);
                RankRegistered[top24[top24.length - i]] = true;
                rank++;
                emit EndAuction("EarlyAccessToken", RankRegistered[top24[top24.length - i]], TopOfTheAuction[rank],i ,block.number,block.timestamp);
            }
            if(rank > top){
                break;
            }
        }
        if(top > top24.length){
        top = rank - 1;
        }
        ISwapPage(IAdmin(Admin).swapPage()).setStartTime(block.timestamp);
        flag = true;
        return flag;
    }

    /**
    @dev this function is used to bid for the NFT
    @param amount bid amount
    */

    function biddingNFT(uint256 amount) public {
        if(highestBid == 0){
            require(amount >= 1,"invalid Amount");
        }else{
            require(Bidding[msg.sender] + amount * 10 ** 18 >= highestBid + 10 ** 18,"EarlyAccessToken: Should bid greater than the current highest bid");
        }
        require(
            block.timestamp < startTime + duration,
            "EarlyAccessToken: Auction ended"
        );
        _biddingNFT(amount);
    }

    /**
    NOTE Mention the duration in hours
    @dev this function sets duration of the Auction
    @param time time of auction
    */

    function setDuration(uint256 time) public _isAdmin {
        require(time >0,"Early Access: time can't be Zero, must be a valid number");
        emit SetterForUint("EarlyAccess",address(this), duration, time,block.number,block.timestamp);
        duration = time * 60;
    }

    /**
    @dev this function sets the number of top claimers
    @param _top number of top claimers
    */

    function setTop(uint256 _top) public _isAdmin {
        require(_top > 0, "EarlyAccess: Value cam't be zero");
        emit SetterForUint("EarlyAccess",address(this), top, _top,block.number,block.timestamp);
        top = _top;
    }

    function setStartTime(uint256 _startTime) public _isAdmin{
        require(_startTime > 0, "EarlyAccess: Value cam't be zero");
        startTime = _startTime;
    }

    /**
    @dev this function is used to claim rewards
    */

    function ClaimBid() public {
        require(
            block.timestamp > startTime + duration && flag,
            "EarlyAccessToken: Auction has not ended yet"
        );
        require(
            Bidding[msg.sender] != 0,
            "EarlyAccessToken: You don't have any BUSD to claim."
        );
        require(TopOfTheAuction[Won[msg.sender]] != msg.sender,"EarlyAccessToken: You can not claim.");
        IERC20(IAdmin(Admin).BUSD()).transfer(msg.sender, Bidding[msg.sender]);
        Bidding[msg.sender] = 0;
        emit ClaimBID("EarlyAccessToken",msg.sender, Won[msg.sender], Bidding[msg.sender],block.number,block.timestamp);
    }


    function flagReturn() public view returns(bool){
        if(block.timestamp > startTime + duration && flag == false){
            return true;
        }
        else{
            return false;
        }
    }

    /**
    @dev this is an internal function for the bidding NFT
    */

    function _biddingNFT(uint256 amount) internal {
        
        IERC20(Admin.BUSD()).transferFrom(msg.sender, address(this), amount* 10 ** 18);
        Bidding[msg.sender] += amount* 10 ** 18;
        top24.push(msg.sender);
        highestBidder = msg.sender;
        highestBid = Bidding[msg.sender];
        emit BiddingNFT("EarlyAccessToken",msg.sender, amount* 10 ** 18, Bidding[msg.sender],block.number,block.timestamp,1);
        
    }

   }
