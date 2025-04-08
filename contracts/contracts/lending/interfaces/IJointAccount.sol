// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

/*
@title The interface for the joint account
*/
interface IJointAccount {
    /**
     * @dev To get the status of whether the address is a member or not in joint account
     *
     * Returns a boolean value indicating whether the address is a member or not in joint account
     */
    function isMember(address _accountAddress) external view returns (bool);
}
