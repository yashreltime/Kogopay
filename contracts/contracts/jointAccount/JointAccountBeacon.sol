// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol';
import '@openzeppelin/contracts/proxy/beacon/IBeacon.sol';

contract JointAccountBeacon is Ownable, IBeacon {
  UpgradeableBeacon immutable beacon;

  address public blueprint;

  mapping(uint256 => address) public DeployerInstance;
  mapping(address => bool) public isDeployer;
  event instanceCreated(uint256 accountId, address creator, address deployerContract);

  constructor(address payable _libraryAddress) {
    beacon = new UpgradeableBeacon(_libraryAddress);
    blueprint = _libraryAddress;
    transferOwnership(tx.origin);
  }

  function update(address _libraryAddress) public onlyOwner {
    beacon.upgradeTo(_libraryAddress);
    blueprint = _libraryAddress;
  }

  function implementation() external view returns (address) {
    return beacon.implementation();
  }
}
