// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract SwapperV2 is Initializable, ReentrancyGuardUpgradeable {
    // Keep ALL original variables in SAME order
    uint256 _status; // From ReentrancyGuard
    uint256[] __gap; // From ReentrancyGuard
    
    // Original variables from previous version
    address[] userList;
    mapping(address => bool) userStructs;
    address contractRegistry;
    mapping(uint256 => address) proposalStructs;
    address[] proposalList;
    address proposalRegistry;
    
    // New variables (added at the end only)
    uint256 public marketRate;
    uint256 public swapFeePct;
    
    // Your new implementation logic...
} 