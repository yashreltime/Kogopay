/// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import './interfaces/IUser.sol';

/**
 * @title UserRegistry
 */
contract UserRegistry is OwnableUpgradeable {
  using SafeMathUpgradeable for uint256;

  address[] public userList;
  mapping(address => IUser.UserStruct) public userStructs;

  event LogCreateUser(address userAddress);
  event LogUserDeleted(address userAddress);
 
  /**
    @dev Function to get the count of users
  */
  function getUserCount() external view returns (uint256 userCount) {
    return userList.length;
  }

  /**
    @dev Function to verify the user registered or not
    @param _userId User address
  */
  function isUser(address _userId) public view returns (bool isIndeed) {
    if (userList.length == 0) return false;
    if (userStructs[_userId].userListPointer == userList.length) return false;
    else if (userList[userStructs[_userId].userListPointer] == _userId) return true;
    else return false;
  }

  /**
    @dev Function to get the user address at specific index
    @param _index Index number
  */
  function getUserAddressAtIndex(uint256 _index) external view returns (address _userAddress) {
    return userList[_index];
  }

  /**
    @dev Function to get the count of lendings created by user
  */
  function getUserProposalCount() external view returns (uint256 _proposalCount) {
    require(isUser(msg.sender), '_user is not registered');
    return userStructs[msg.sender].proposalIds.length;
  }

  /**
    @dev Function to get the proposal ids of specific user at index
    @param _userId User address
    @param _index Index number
  */
  function getUserProposalAtIndex(address _userId, uint256 _index)
    external
    view
    returns (uint256 proposalKey)
  {
    require(isUser(_userId), '_user is not registered');
    require(userStructs[_userId].proposalIds.length > 0, '_proposals are not created');
    return userStructs[_userId].proposalIds[_index];
  }

  /**
    @dev Function to get the user details based on address
    @param _userId User address
  */
  function getUserDetailsByAddress(address _userId)
    external
    view
    returns (
      uint256[] memory _proposalIds,
      uint256[] memory _borrowings,
      uint256[] memory _pendingRequests
    )
  {
    require(isUser(_userId), '_user is not registered');
    return (
      userStructs[_userId].proposalIds,
      userStructs[_userId].borrowings,
      userStructs[_userId].pendingRequests
    );
  }

  /**
    @dev Function to create a single user
    @param _userId User address
  */
  function createUser(address _userId) public onlyOwner returns (bool isIndeed) {
    require(!isUser(_userId), '_user is already registered');
    userStructs[_userId].userListPointer = userList.length;
    userList.push(_userId);
    emit LogCreateUser(_userId);
    return true;
  }

  /**
    @dev Function to create a multiple users
    @param _userId User addresses
  */
  function addUsers(address[] memory _userId) public onlyOwner returns (bool isIndeed) {
    for (uint256 i = 0; i < _userId.length; i++) {
      createUser(_userId[i]);
    }
    return true;
  }

  /**
    @dev Function to delete a single user
    @param _userId User address
  */
  function deleteUser(address _userId) external onlyOwner returns (bool succes) {
    require(isUser(_userId), '_user is not registered');
    require(userStructs[_userId].proposalIds.length == 0, '_proposals list is not empty');
    uint256 rowToDelete = userStructs[_userId].userListPointer;
    address keyToMove = userList[userList.length - 1];
    userList[rowToDelete] = keyToMove;
    userStructs[keyToMove].userListPointer = rowToDelete;
    userList.pop();
    emit LogUserDeleted(_userId);
    return true;
  }
}
