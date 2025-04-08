// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface MedianOracle {
  function pushReport(uint256 payload) external;
}
