// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import './Vaults.sol';
import './User.sol';
import './ContractRegistry.sol';
import './UserRegistry.sol';
import './ProposalRegistry.sol';

/**
    @title ProposalRequestRegistry
*/
contract ProposalRequestRegistry is
  ReentrancyGuardUpgradeable,
  OwnableUpgradeable,
  UserRegistry,
  ProposalRegistry
{
  using SafeMathUpgradeable for uint256;
  ProposalRegistry proposalRegistry;

  /**
    @dev Initialize function
    @param _registryContractAddress Contract Registry smart contract address
  */
  function initialize(ContractRegistry _registryContractAddress) public initializer {
    __ReentrancyGuard_init();
    __Ownable_init();
    contractRegistry = ContractRegistry(_registryContractAddress);
  }

  /**
    @dev Function to update contract registry addresses
    @param _registryContractAddress Contract Registry smart contract address
  */
  function updateExternalAccounts(ContractRegistry _registryContractAddress) external onlyOwner {
    contractRegistry = ContractRegistry(_registryContractAddress);
  }

  /**
   @dev Internal function to accept proposal by borrower
   @param _proposalId Propsal unique ID
  */
  function acceptProposal(uint256 _proposalId) internal view {
    require(isUser(msg.sender), '_user is not registered');
    require(isProposal(_proposalId), '_proposal is invalid');
    require(msg.sender != proposalStructs[_proposalId].userId, '_operation disabled for owner');
    require(
      !proposalStructs[_proposalId].borrowDetails.borrowerStatus,
      '_request accepted by borrower'
    );
    require(
      !proposalStructs[_proposalId].isDirectInfo.isDirect ||
        (proposalStructs[_proposalId].isDirectInfo.isDirect &&
          proposalStructs[_proposalId].isDirectInfo.isDirectAddress == _msgSender()),
      '_operation not allowed'
    );
  }

  /**
   @dev External function to accept proposal without collateral by borrower
   @param _proposalId Propsal unique ID
   @return _success Bool
  */
  function acceptRequestWithoutCollateral(uint256 _proposalId) external returns (bool _success) {
    acceptProposal(_proposalId);
    {
      bool tokenStatus = this.initiateTokenPayment(
        proposalStructs[_proposalId].userId,
        msg.sender,
        _proposalId,
        proposalStructs[_proposalId].amount
      );
      require(tokenStatus, '_ Token Deposit transfer failed.');
    }
    updateProposalStatus(_proposalId);
    if (proposalStructs[_proposalId].isDirectInfo.isDirect) {
      bool _status = updatePendingRequests(_proposalId);
      require(_status, '_isDirect status update failed');
    }

    return true;
  }

  /**
   @dev External function to accept proposal with collateral by borrower
   @param _proposalId Propsal unique ID
   @param _collateralAddress Collateral ERC20 Token Address
   @param _collateralAmount Collateral Amount
   @param _collateralperUnitPrice Unit price of collateral token
   @return success
  */
  function acceptRequestWithCollateral(
    uint256 _proposalId,
    address _collateralAddress,
    uint256 _collateralAmount,
    uint256 _collateralperUnitPrice
  ) external payable nonReentrant returns (bool success) {
    acceptProposal(_proposalId);
    require(
      proposalStructs[_proposalId].collateralInfo.collateralState == CollateralState.PENDING ||
        proposalStructs[_proposalId].collateralInfo.collateralState == CollateralState.FAILED,
      '_proposal is not accepting any collateral'
    );

    uint256 amountValidateQuantity = this.estimateCollateralAsPerUnitPrice(
      proposalStructs[_proposalId].collateralInfo.collateralTokenQuantity,
      _collateralperUnitPrice
    );
    require(amountValidateQuantity <= _collateralAmount, '_collateral amount is not valid');
    uint256 collateralTokenQuantity = calcCollateralAmount(
      proposalStructs[_proposalId].amount,
      proposalStructs[_proposalId].interestRate
    );
    proposalStructs[_proposalId].collateralInfo.collateralTokenQuantity = collateralTokenQuantity;
    //Transfer collateral from user Address to escrow
    proposalStructs[_proposalId].collateralInfo.collateralTypeAddress = _collateralAddress;
    proposalStructs[_proposalId].collateralInfo.collateralPerPrice = _collateralperUnitPrice;
    //*********************** */
    // proposalStructs[_proposalId].collateralInfo.collateralTotalPrice = collateralTokenQuantity.mul(
    //   _collateralperUnitPrice.div((10**contractRegistry.DECIMALS()))
    // );
    //****************************** */
    proposalStructs[_proposalId].collateralInfo.collateralTotalPrice = amountValidateQuantity;
    {
      bool status = Vaults(contractRegistry.getIVaultContractAddress()).depositCollateral(
        msg.sender,
        _collateralAddress,
        _collateralAmount,
        _proposalId
      );
      require(status, '_ Colateral Deposit transfer failed.');
      proposalStructs[_proposalId].collateralInfo.collateralState = CollateralState.RECEIVED;
      bool tokenStatus = this.initiateTokenPayment(
        proposalStructs[_proposalId].userId,
        msg.sender,
        _proposalId,
        proposalStructs[_proposalId].amount
      );
      require(tokenStatus, '_ Token Deposit transfer failed.');

      updateProposalStatus(_proposalId);
      if (proposalStructs[_proposalId].isDirectInfo.isDirect) {
        bool _status = updatePendingRequests(_proposalId);
        require(_status, '_isDirect status update failed');
      }
    }
    return true;
  }

  /**
   @dev Internal function to change proposal status after successfull
   accept or collateral submission borrower
   @param _proposalId Propsal unique ID
  */
  function updateProposalStatus(uint256 _proposalId) internal {
    proposalStructs[_proposalId].proposalState = ProposalState.INACTIVE;
    proposalStructs[_proposalId].borrowDetails.borrowState = BorrowState.ACTIVE;
    //Update borrowings
    userStructs[msg.sender].borrowings.push(_proposalId);
    proposalStructs[_proposalId].borrowDetails.borrowerStatus = true;
    proposalStructs[_proposalId].borrowDetails.borrowerAddress = _msgSender();
  }

  /**
   @dev Function to transfer lending amount to borrower
   @param _fromAddress From address
   @param _toAddress To address
   @param _proposalId Propsal unique ID
   @param _amount Amount to transfer
  */
  function initiateTokenPayment(
    address _fromAddress,
    address _toAddress,
    uint256 _proposalId,
    uint256 _amount
  ) external returns (bool success) {
    require(
      proposalStructs[_proposalId].borrowDetails.borrowState == BorrowState.INACTIVE,
      '_borrower request is not accepted'
    );
    require(
      proposalStructs[_proposalId].proposalState == ProposalState.ACTIVE,
      '_proposal is inactive'
    );
    require(
      !proposalStructs[_proposalId].borrowDetails.receivedAmountStatus,
      '_borrower already received amount'
    );
    require(proposalStructs[_proposalId].amount == _amount, '_validate the transferring amount');
    {
      bool status = Vaults(contractRegistry.getIVaultContractAddress()).withdrawToken(
        _fromAddress,
        _toAddress,
        _amount,
        _proposalId
      );
      require(status, '_Token Deposit to borrower failed.');
    }
    proposalStructs[_proposalId].borrowDetails.receivedAmountStatus = true;
    return true;
  }

  /**
   @dev Internal function to calculate collateral amount
   @param _amount Principal Amount
   @param _interestAmount Total interest
   @return totalRTOAsCollateral Collateral Amount
  */
  function calcCollateralAmount(uint256 _amount, uint256 _interestAmount)
    internal
    view
    returns (uint256)
  {
    uint256 collateralPercent = contractRegistry.collateralPercentage();
    uint256 percentageChange = contractRegistry.collateralInterestChange();
    uint256 interestAmountPercentage = _interestAmount.mul(percentageChange);
    uint256 totalPercentage = (collateralPercent.div(10**contractRegistry.DECIMALS())).add(
      interestAmountPercentage.div(10**contractRegistry.DECIMALS())
    );
    uint256 totalRTOAsCollateral = (_amount.mul(totalPercentage)).div(10**2);
    return totalRTOAsCollateral;
  }

  /**
   @dev External function to calculate collateral amount
   @param _amount Principal Amount
   @param _interestAmount Total interest
   @return _collateralPercent Perecentage of Principal Amount
   @return _percentageChange Multiplication factor for interest rate
   @return _interestAmountPercentage percentage change * interest rate
   @return _totalPercentage collateralPercent + interestAmountPercentage
   @return _totalRTOAsCollateral Principal Amount * (1+(totalPercentage/100))
  */
  function calcCollateralAmountTable(uint256 _amount, uint256 _interestAmount)
    external
    view
    returns (
      uint256 _collateralPercent,
      uint256 _percentageChange,
      uint256 _interestAmountPercentage,
      uint256 _totalPercentage,
      uint256 _totalRTOAsCollateral
    )
  {
    uint256 collateralPercent = contractRegistry.collateralPercentage();
    uint256 percentageChange = contractRegistry.collateralInterestChange();
    uint256 interestAmountPercentage = _interestAmount.mul(percentageChange);
    uint256 totalPercentage = (collateralPercent.div(10**contractRegistry.DECIMALS())).add(
      interestAmountPercentage.div(10**contractRegistry.DECIMALS())
    );
    uint256 totalRTOAsCollateral = (_amount.mul(totalPercentage)).div(10**2);
    return (
      collateralPercent,
      percentageChange,
      interestAmountPercentage,
      totalPercentage,
      totalRTOAsCollateral
    );
  }

  /**
   @dev Function to estimate collateral as per unit price
   @param _collateralTokenQuantity Collateral Amount
   @param _collateralperUnitPrice Collateral token unit price
   @return collExpAsCollUnit Total collateral
  */
  function estimateCollateralAsPerUnitPrice(
    uint256 _collateralTokenQuantity,
    uint256 _collateralperUnitPrice
  ) external view returns (uint256 collExpAsCollUnit) {
    uint256 collTotalAsCollUnit = (_collateralTokenQuantity.mul(_collateralperUnitPrice)).div(
      (10**contractRegistry.DECIMALS())
    );
    return (collTotalAsCollUnit);
  }

  /**
   @dev Function to reject direct lending by borrower
   @param _proposalId Collateral Amount
  */
  function rejectRequestByBorrower(uint256 _proposalId) external nonReentrant returns (bool) {
    require(isUser(msg.sender), '_user is not registered');
    require(isProposal(_proposalId), '_proposal is invalid');
    require(
      proposalStructs[_proposalId].borrowDetails.borrowState == BorrowState.INACTIVE,
      '_borrower request is not accepted'
    );
    require(
      proposalStructs[_proposalId].proposalState == ProposalState.ACTIVE,
      '_proposal is inactive'
    );
    require(msg.sender != proposalStructs[_proposalId].userId, '_operation disabled for owner');
    require(
      !proposalStructs[_proposalId].borrowDetails.borrowerStatus,
      '_not authorised to request'
    );
    if (proposalStructs[_proposalId].isDirectInfo.isDirect) {
      {
        bool status = Vaults(contractRegistry.getIVaultContractAddress()).refundToken(
          address(contractRegistry.getIVaultContractAddress()),
          proposalStructs[_proposalId].userId,
          proposalStructs[_proposalId].amount,
          _proposalId
        );
        require(status, '_token refund transfer failed.');
      }
      bool _status = updatePendingRequests(_proposalId);
      require(_status, '_isDirect status update failed');
      bool _statusDel = deleteProposalStruct(_proposalId);
      require(_statusDel, '_isDirect delete failed');
    }
    return true;
  }
}
