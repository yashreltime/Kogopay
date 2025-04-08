// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import './interfaces/IUser.sol';

/**
    @title User
*/
contract User {
  mapping(address => IUser.UserStruct) public userStructs;
  address[] public userList;
}
