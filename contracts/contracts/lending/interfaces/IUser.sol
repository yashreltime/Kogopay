// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

/**
 * @dev Interface of the User
 */
interface IUser {
    /**
     * @dev struct definition for user
     */
    struct UserStruct {
        uint256 userListPointer;
        uint256[] proposalIds; //created proposals
        mapping(uint256 => uint256) proposalIdPointers;
        uint256[] borrowings; //my borrowings
        uint256[] pendingRequests; // Direct
    }

    /**
     * @dev To get the status of whether the address is existing or not
     *
     * Returns a boolean value indicating whether the address is existing or not
     */
    function isUser(address) external view returns (bool);
}
