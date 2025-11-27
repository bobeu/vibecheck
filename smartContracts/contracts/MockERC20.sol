// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Mock ERC20 token for testing purposes
 */
contract MockERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint8 /* decimals - not used, ERC20 uses 18 decimals by default */
    ) ERC20(name, symbol) {
        // ERC20 from OpenZeppelin uses 18 decimals by default
    }

    /**
     * @dev Mint tokens to an address (for testing)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from an address (for testing)
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

