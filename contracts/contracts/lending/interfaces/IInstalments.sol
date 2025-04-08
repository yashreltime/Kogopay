// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

/**
 * @dev Interface of the Instalment Payment
 */
interface IInstalments {
    /**
     * @dev enum definition for transaction state
     */
    enum TransactionState {
        SUCCESS,
        FAILED,
        PENDING
    }
    /**
     * @dev enum definition for type of Instalments
     */
    enum InstalmentType {
        DIRECT,
        COLLATERAL,
        MULTIDIRECT,
        MULTICOLLATERAL
    }
    /**
     * @dev struct definition for payement transactions
     */
    struct ProposalTransactionStruct {
        uint256 instalmentCount;
        uint256 transactionDate;
        uint256 instalmentUserAmount;
        uint256 instalmentAdminAmount;
        InstalmentType instalmentType;
        TransactionState state;
    }
    /**
     * @dev struct definition for Instalment info
     */
    struct InstalmentStruct {
        uint256 lastInstalmentCount;
        bool collateralAsInstalment;
        uint256 colateralInstalmentCount;
        uint256 directInstalmentCount;
        bool closeProposal;
        bool fullPaymentClose;
        bool delayPaymentClose;
    }
}
