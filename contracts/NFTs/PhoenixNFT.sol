// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "contracts/NFTs/My721.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IWhitelist.sol";

contract PhoenixNft is
    My721,
    Initializable,
    AccessControl,
    ReentrancyGuard,
    IEvents
{
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for minter role
    uint256 startTime;
    uint256 public tokenId = 1;
    uint256 public duration = 8 hours;
    uint256 public expiryTime = 365;
    uint256 totalAmount = 0;
    uint256 public highestBid = 500 * 10**18;
    address public highestBidder;
    string URI;

    enum Nft_status {
        INACTIVE,
        ACTIVE
    }
    mapping(uint256 => uint256) public nftStatus;

    mapping(uint256 => mapping(address => uint256)) public BidsForAuctions;
    mapping(address => uint256) public BiddingArray;
    mapping(address => uint256) public Won;
    mapping(uint256 => address) public Winner;
    mapping(uint256 => uint256) public MintTimestamp;
    IAdmin public Admin;

    modifier _isAdmin() {
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    modifier _isAdminOrOperator() {
        require(
            Admin.hasRole(OPERATOR_ROLE, msg.sender) ||
                Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
        );
        _;
    }

    function initialize(
        address _admin,
        string memory _uri,
        string memory name_,
        string memory symbol_
    ) external initializer {
        Admin = IAdmin(_admin);
        URI = _uri;
        _name = name_;
        _symbol = symbol_;
        startTime = block.timestamp;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl, My721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
NOTE can only be called by Admin
@dev this function resets Auction for a new day
 */

    function resetForNewAuction() external _isAdminOrOperator {
        if (highestBidder != address(0)) {
            IERC20(IAdmin(Admin).BUSD()).transfer(
                IAdmin(Admin).TeamAddress(),
                highestBid
            );
            BiddingArray[highestBidder] -= highestBid;
            Won[highestBidder] = tokenId;
            Winner[tokenId] = highestBidder;
            highestBidder = address(0);
            tokenId++;
            startTime = block.timestamp;
            emit ResetNewAuction(
                "PhoenixNFT",
                highestBid,
                Winner[tokenId],
                BiddingArray[highestBidder],
                block.number,
                block.timestamp
            );
            highestBid = 0;
        } else {
            startTime = block.timestamp;
        }
    }

    /**
@dev this function is used to claim rewards as BUSD
 */

    function ClaimBid() public nonReentrant {
        require(
            block.timestamp > startTime + duration,
            "PhoenixNFT: Auction has not ended yet"
        );
        require(
            BiddingArray[msg.sender] != 0 ||
                BidsForAuctions[Won[msg.sender]][msg.sender] != 0,
            "PhoenixNFT: You don't have any BUSD to claim."
        );
        if (Winner[Won[msg.sender]] == msg.sender) {
            mint(msg.sender, URI, Won[msg.sender]);
        } else {
            IERC20(IAdmin(Admin).BUSD()).transfer(
                msg.sender,
                BiddingArray[msg.sender]
            );
        }
        emit ClaimBID(
            "PhoenixNft",
            msg.sender,
            Won[msg.sender],
            BiddingArray[msg.sender],
            block.number,
            block.timestamp
        );
        BiddingArray[msg.sender] = 0;
    }

    function setDuration(uint256 time) public _isAdminOrOperator {
        require(
            time > 0,
            "PhoenixNft: Time can't be Zero, must be a valid Number"
        );
        emit SetterForUint(
            "PhoenixNft",
            address(this),
            duration,
            time,
            block.number,
            block.timestamp
        );
        duration = time * 3600;
    }

    /**
@dev this function is used to bid for phoenix NFT
@param amount amount user bids
 */

    function biddingNFT(uint256 amount) public nonReentrant {
        require(
            balanceOf(msg.sender) == 0,
            "You cannot participate in auction"
        );
        require(
            BidsForAuctions[tokenId][msg.sender] + amount >= check(highestBid),
            "PhoenixNFT: Did not reach the minimum bid"
        );
        require(
            block.timestamp < startTime + duration,
            "PhoenixNFT: Auction for this nft completed"
        );
        if (block.timestamp < startTime + duration - 5 minutes) {
            _biddingNFT(amount);
        } else {
            duration = duration + 5 minutes;
            _biddingNFT(amount);
        }
    }

    function setNftStatus(uint256 tokenid) public _isAdminOrOperator {
        require(Winner[tokenid] == address(0), "Token ID doesn't exist");
        if (nftStatus[tokenid] == uint256(Nft_status.INACTIVE)) {
            nftStatus[tokenid] = uint256(Nft_status.ACTIVE);
        } else {
            nftStatus[tokenid] = uint256(Nft_status.INACTIVE);
        }
    }

    function setNftActive(uint256 tokenid) public {
        require(
            block.timestamp >
                MintTimestamp[tokenid] + (expiryTime * duration) &&
                Winner[tokenid] != address(0),
            "NFT is still active"
        );
        require(ownerOf(tokenid) == msg.sender, "Incorrect Token ID");
        IERC20(Admin.BUSD()).transferFrom(
            msg.sender,
            address(this),
            500 * 10**18
        );
        nftStatus[tokenid] = uint256(Nft_status.ACTIVE);
    }

    /**
@dev this is an internal function that performs deposit functionality
@param amount amount user bids
 */
    function _biddingNFT(uint256 amount) internal {
        IERC20(IAdmin(Admin).BUSD()).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        BiddingArray[msg.sender] += amount;
        BidsForAuctions[tokenId][msg.sender] += amount;
        totalAmount += amount;
        highestBidder = msg.sender;
        highestBid = BidsForAuctions[tokenId][msg.sender];
        emit BiddingNFT(
            "PhoenixNFT",
            msg.sender,
            amount,
            BiddingArray[msg.sender],
            block.number,
            block.timestamp,
            tokenId
        );
    }

    /**
@dev this function mints NFT to the auction winner
@param to to address
@param _URI uri metadata
@param _tokenId tokenid of NFT
 */
    function mint(
        address to,
        string memory _URI,
        uint256 _tokenId
    ) internal {
        require(tokenId <= 10000, "Minting Limit Exceeded");
        _safeMint(to, _tokenId);
        _setTokenURI(_tokenId, _URI);
        nftStatus[Won[msg.sender]] = uint256(Nft_status.ACTIVE);
        MintTimestamp[_tokenId] = block.timestamp;
    }

    /**
@dev this functions checks that there should be a 5% increase in the highest bid amount
@param _highestBid amount to be checked
 */
    function check(uint256 _highestBid) internal pure returns (uint256) {
        if (((_highestBid * 5) / 100) < (20 * 10**18)) {
            return (20 * 10**18) + _highestBid;
        } else {
            return _highestBid + ((_highestBid * 5) / 100);
        }
    }

    /**
@dev this is an internal function for burn NFT functionality
@param tokenID tokenID of the NFT to be burnt
 */
    function _burn(uint256 tokenID) internal virtual override {
        super._burn(tokenID);
    }

    /**
@dev transfer functionality do not applies

 */
    function _transfer(
        address from,
        address to,
        uint256 tokenid
    ) internal virtual override {
        require(
            nftStatus[tokenid] != uint256(Nft_status.INACTIVE),
            "NFT is InActive"
        );
        super._transfer(from, to, tokenid);
        if (!IWhitelist(Admin.whitelist()).getAddresses(to)) {
            nftStatus[tokenid] = uint256(Nft_status.INACTIVE);
        }
    }
}
