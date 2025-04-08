// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

/**
 * @dev Interface of the Escrow
 */
interface IEscrow {
    /**
     * @dev To deposit the amount `_amountToDeposit` from `_fromAddress`
     * to contract
     */
    function deposit(address _fromAddress, uint256 _amountToDeposit)
        external
        returns (bool);

    /**
     * @dev To withdraw the amount `_amountToWithdraw` to `_toAddress`
     * from contract
     */
    function withdraw(address toAddress, uint256 amountToWithdraw)
        external
        returns (bool);
}
