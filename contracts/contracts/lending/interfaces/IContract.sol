// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;
import "./IProposal.sol";
import "./IEscrow.sol";
import "./IUser.sol";

/**
 * @dev Interface of the Contract management
 */
interface IContract {
    /**
     * @dev Struct definition for the contract addresses
     */
    struct AddrManager {
        IEscrow escrowContractAddr;
        IUser userContractAddr;
        IProposal proposalContractAddr;
    }
}
