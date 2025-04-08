// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

/**
 * @dev Interface of the Proposal
 */
interface IProposal {
  /**
   * @dev struct definition for earnings
   */
  struct EarningsStruct {
    uint256 interestAmount;
    uint256 totalAmount;
    uint256 totalAdminShare;
    uint256 monthlyAdminShare;
    uint256 totalUserShare;
    uint256 monthlyUserShare;
    uint256 monthlyTotalShare;
    uint256 completedInstallments;
  }
  /**
   * @dev enum definition for proposals
   */
  enum ProposalState {
    INACTIVE,
    ACTIVE,
    CLOSED,
    DELETED
  }
  /**
   * @dev enum definition for borrow status
   */
  enum BorrowState {
    INACTIVE,
    ACTIVE,
    CLOSED
  }
  /**
   * @dev enum definition for collateral status
   */
  enum CollateralState {
    INVALID,
    PENDING,
    RECEIVED,
    FAILED
  }
  /**
   * @dev struct definition for proposals
   */
  struct ProposalStruct {
    uint256 proposalListPointer;
    address userId;
    uint256 amount;
    uint256 interestRate;
    uint256 instalmentMonths;
    DatesInfo datesInfo;
    bool isCollateral;
    CollateralStruct collateralInfo;
    DirectInfo isDirectInfo;
    ProposalState proposalState;
    BorrowerStruct borrowDetails;
    EarningsStruct earnings;
    uint256 proposalId;
  }
  /**
   * @dev stsruct definition for direct address details
   */
  struct DirectInfo {
    bool isDirect;
    address isDirectAddress;
  }
  /**
   * @dev strcut definition for proposals dates
   */
  struct DatesInfo {
    uint256 createdDate;
    uint256 updatedDate;
  }
  /**
   * @dev struct definition for borrower
   */
  struct BorrowerStruct {
    address borrowerAddress;
    BorrowState borrowState; //INACTIVE,ACTIVE,CLOSED
    bool receivedAmountStatus;
    bool borrowerStatus;
  }
  /**
   * @dev struct definition for collateral
   */
  struct CollateralStruct {
    address collateralTypeAddress;
    uint256 collateralPerPrice; //1 RTO = ? ETH
    uint256 collateralTotalPrice; // TOTAL RTO* ETH PRICE
    uint256 collateralTokenQuantity; //TOTAL RTO130*120% = amount RTO in terms of RTO
    CollateralState collateralState;
  }

  /**
   * @dev To get the owner address from  `prposal Id` #.
   *
   * Returns a address indicating the owner of proposal.
   */
  function getProposalOwner(uint256) external view returns (address);
}
