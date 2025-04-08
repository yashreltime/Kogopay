// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol';

import './JointAccount.sol';
import './JointAccountBeacon.sol';

contract JointAccountFactory is OwnableUpgradeable {
  JointAccountBeacon private jointAccountBeacon;

  mapping(uint256 => address) private accounts;
  mapping(address => bool) public isDeployer;
  event instanceCreated(uint256 accountId, address creator, address deployerContract);

  function initialize(address payable _libraryAddress, address _owner) public initializer {
    __Ownable_init();
    jointAccountBeacon = new JointAccountBeacon(_libraryAddress);
    transferOwnership(_owner);
  }

  function addDeployerRole(address _deployer) public onlyOwner returns (bool) {
    require(_deployer != address(0) && isDeployer[_deployer] == false, 'creator exist');
    isDeployer[_deployer] = true;
    return true;
  }

  function onlyDeployer() internal view {
    require(isDeployer[msg.sender] == true, 'not a deployer');
  }

  //add new account
  function addJointAccount(
    uint256 _accountId,
    address _accountOwner,
    address[] memory _accountMembers,
    address _rootAdmin,
    address _stableCoinAddress
  ) public {
    BeaconProxy jointAccount = new BeaconProxy(
      address(jointAccountBeacon),
      abi.encodeWithSelector(
        JointAccount(payable(address(0))).initialize.selector,
        _rootAdmin,
        _accountOwner,
        _accountMembers,
        _stableCoinAddress
      )
    );
    JointAccount instance = JointAccount(payable(address(jointAccount)));
    instance.transferOwnership(_accountOwner);

    accounts[_accountId] = address(jointAccount);

    emit instanceCreated(_accountId, _accountOwner, address(jointAccount));
  }

  function getBeacon() public view returns (address) {
    return address(jointAccountBeacon);
  }

  function getImplementation() public view returns (address) {
    return jointAccountBeacon.implementation();
  }

  function getAccountAddress(uint256 _accountId) public view returns (address) {
    return accounts[_accountId];
  }
}
