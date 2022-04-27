// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract CarItems is ERC1155 {
    string public name;
    string public symbol;
    uint256 public constant CAR1 = 0;
    uint256 public constant CAR2 = 1;
    uint256 public constant CAR3 = 2;
    uint256 public constant MOTOR1 = 3;
    uint256 public constant MOTOR2 = 4;

    constructor() public ERC1155("https://example/item/{id}.json") {
        name = "Airdrop NFT";
        symbol = "CAR";
        _mint(msg.sender, CAR1, 1000, "");
        _mint(msg.sender, CAR2, 1000, "");
        _mint(msg.sender, CAR3, 1000, "");
        _mint(msg.sender, MOTOR1, 1000, "");
        _mint(msg.sender, MOTOR2, 1000, "");
    }
}
