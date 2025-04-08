// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

/*
@title The interface for the vault contract
*/
interface IVault {
    /**
     * @dev struct definition for Vault
     */
    struct Vault {
        uint256 collateralAmount; //The amount of collateral held by the vault contract - RTO,RTC,ETH
        address collateralType; //The collateral type - RTO,RTC,ETH,USDT address
        uint256 debtAmount; // The amount of stable coin that was transferred against the collateral - RTO
    }

    /**
    @notice Allows a user to deposit RTO and also RTC,ETH as collateral in exchange for some amount of stablecoin(RTO)
    @param  fromAddress the from address
    @param toAddress  the to address
    @param amountToDeposit  The amount of token the user sent in the transaction to deposit
     */
    function depositToken(
        address fromAddress,
        address toAddress,
        uint256 amountToDeposit
    ) external payable;

    /**
    @notice Allows a user to withdraw amount of the token they have on deposit
    @dev This cannot allow a user to withdraw more than they put in
    @param  fromAddress the from address
    @param toAddress  the to address
    @param repaymentAmount  the amount of token withdrawing
     */
    function withdrawToken(
        address fromAddress,
        address toAddress,
        uint256 repaymentAmount
    ) external;

    /**
    @notice Returns the details of a vault
    @param userAddress  the address of the vault owner
    @return vault  the vault details
     */
    function getVault(address userAddress)
        external
        view
        returns (Vault memory vault);
}
