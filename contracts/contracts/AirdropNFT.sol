// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AirdropNFT is Ownable, ReentrancyGuard {
    // Storage for all airdrops to identify executed airdrops
    mapping(// receiver address
    address => mapping(// token address
    address => mapping(// token id
    uint256 => bool)))
        public airdrops;

    // Storage for all airdrops that have been canceled
    mapping(// distributor address
    address => mapping(// token address
    address => bool))
        public cancledAirdrops;

    // Being able to pause the aidrop contract (just in case)
    bool public paused;

    struct Airdrop {
        //
        // The address of the token contract
        //
        address tokenAddress;
        //
        // Addresses of users which are allowed to withdrawal an airdrop
        //
        address[] receivers;
        //
        // Indicates the NFT standard if standard supports ERC1155 or not
        //
        bool isERC1155;
        //
        // TokenIds
        //
        uint256[] tokenIds;
    }

    //
    modifier onlyUnpaused() {
        require(paused == false, "Airdrops are paused!");
        _;
    }

    ////////////////////////////////////////////////
    //////// F U N C T I O N S
    //
    // airdop NFT
    //
    function airdrop(
        address tokenAddress,
        address[] memory receivers,
        bool isERC1155,
        uint256[] memory tokenIds
    ) external onlyUnpaused nonReentrant {
        uint8 index = 0;
        for (index; index < receivers.length; index++) {
            uint256 tokenId = tokenIds[index];
            address receiver = receivers[index];

            require(
                airdrops[receiver][tokenAddress][tokenId] == false,
                "Receiver has already retrieved this airdrop!"
            );
            airdrops[receiver][tokenAddress][tokenId] = true;

            require(
                cancledAirdrops[msg.sender][tokenAddress] == false,
                "Distributor has canceled this airdrop!"
            );

            if (isERC1155) {
                // ERC1155
                IERC1155 token = IERC1155(tokenAddress);
                token.safeTransferFrom(
                    msg.sender,
                    receiver,
                    tokenId,
                    1,
                    bytes("")
                );
            } else {
                // ERC721
                IERC721 token = IERC721(tokenAddress);
                token.safeTransferFrom(msg.sender, receiver, tokenId);
            }
        }
    }

    //
    // Change set paused to
    //
    function setPausedTo(bool value) external onlyOwner {
        paused = value;
    }

    //
    // Change set airdrops available to
    //
    function setAirdroped(address receiver, address tokenAddress, uint256 tokenId, bool value) external onlyOwner {
        airdrops[receiver][tokenAddress][tokenId] = value;
    }

    //
    // Cancel airdrop
    //
    function cancel(address tokenAddress) external {
        cancledAirdrops[msg.sender][tokenAddress] = true;
    }
}
