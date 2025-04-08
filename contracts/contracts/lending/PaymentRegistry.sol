/// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import './interfaces/IERC20.sol';
import './interfaces/IVault.sol';
import './Vaults.sol';
import './interfaces/IEscrow.sol';
import './interfaces/IProposal.sol';
import './interfaces/IInstalments.sol';
import './interfaces/IJointAccount.sol';
import './ContractRegistry.sol';
import './ProposalRegistry.sol';

/**
 * @title PaymentRegistry
 */
contract PaymentRegistry is ReentrancyGuardUpgradeable, OwnableUpgradeable {
  using SafeMathUpgradeable for uint256;

  /// Token Contract
  IERC20 public stableCoin;
  ContractRegistry contractRegistry;
  ProposalRegistry proposalReg;

  mapping(uint256 => IInstalments.ProposalTransactionStruct[]) public transactions;
  mapping(uint256 => IInstalments.InstalmentStruct) public instalmentInfo;

  /**
   * @dev Initialize function
   */
  function initialize(
    ContractRegistry _registryContractAddress,
    ProposalRegistry _proposalRegistryAddr,
    IERC20 _stableCoinAddr
  ) public initializer {
    __ReentrancyGuard_init();
    __Ownable_init();
    contractRegistry = ContractRegistry(_registryContractAddress);
    proposalReg = ProposalRegistry(_proposalRegistryAddr);
    stableCoin = IERC20(_stableCoinAddr);
  }

  event TransferStableCoins(address from, address to, uint256 amountOfTokens);
  event ReceivedCoin(address, uint256);

  /**
   * @dev Function to update external contract addresses
   * @param _registryContractAddress Contract registry address
   * @param _proposalRegistryAddr Proposal registry contract address
   * @param _stableCoinAddr Token contract address
   */
  function updateExternalAccounts(
    ContractRegistry _registryContractAddress,
    ProposalRegistry _proposalRegistryAddr,
    IERC20 _stableCoinAddr
  ) external onlyOwner {
    contractRegistry = ContractRegistry(_registryContractAddress);
    proposalReg = ProposalRegistry(_proposalRegistryAddr);
    stableCoin = IERC20(_stableCoinAddr);
  }

  /**
   * @dev To get monthlyInstalment amount
   * @param _proposalId Proposal ID
   * @return _monthlyAdminShare Instalment share monthly for admin
   * @return _monthlyUserShare Instalment share montly for user
   * @return _monthlyTotalShare Instalment share total
   */
  function getMonthlyTokenInstalmentAmount(uint256 _proposalId)
    external
    view
    returns (
      uint256 _monthlyAdminShare,
      uint256 _monthlyUserShare,
      uint256 _monthlyTotalShare
    )
  {
    IProposal.ProposalStruct memory proposal = ProposalRegistry(proposalReg).getProposalDetails(
      _proposalId
    );
    address borrowerAddress = proposal.borrowDetails.borrowerAddress;
    address ownerAddress = proposal.userId;
    require(msg.sender == ownerAddress || msg.sender == borrowerAddress);
    return (
      proposal.earnings.monthlyAdminShare,
      proposal.earnings.monthlyUserShare,
      proposal.earnings.monthlyTotalShare
    );
  }

  /**
   * @dev To pay monthly installments
   * Require approval for this contract address
   * @param _proposalId Proposal ID
   * @param _instalmentCount Number of instalment
   * @param _instalmentAmount Instalment amount
   * @param _paymentAddress Instalment will be taken from this address
   * @return _success Bool
   */
  function toPayInstalments(
    uint256 _proposalId,
    uint256 _instalmentCount,
    uint256 _instalmentAmount,
    address _paymentAddress
  ) external nonReentrant returns (bool _success) {
    IProposal.ProposalStruct memory proposal = ProposalRegistry(proposalReg).getProposalDetails(
      _proposalId
    );
    uint256 totalShare = proposal.earnings.monthlyTotalShare;
    require(_instalmentAmount >= totalShare, '_Insufficient amount for installment');
    require(msg.sender == proposal.borrowDetails.borrowerAddress, '_invalid borrower');
    require(
      _instalmentCount == instalmentInfo[_proposalId].lastInstalmentCount + 1,
      '_invalid Instalment count'
    );

    require(
      _paymentAddress == proposal.borrowDetails.borrowerAddress ||
        IJointAccount(_paymentAddress).isMember(_msgSender()),
      '_invalid payment address'
    );
    bool status = transferShare(
      _paymentAddress,
      proposal.userId,
      proposal.earnings.monthlyUserShare,
      proposal.earnings.monthlyAdminShare
    );
    require(status, '_ Direct Token transfer failed.');
    IInstalments.ProposalTransactionStruct memory transaction = IInstalments
      .ProposalTransactionStruct(
        _instalmentCount,
        block.timestamp,
        proposal.earnings.monthlyUserShare,
        proposal.earnings.monthlyAdminShare,
        IInstalments.InstalmentType.DIRECT,
        IInstalments.TransactionState.SUCCESS
      );
    transactions[_proposalId].push(transaction);

    instalmentInfo[_proposalId].directInstalmentCount = instalmentInfo[_proposalId]
      .directInstalmentCount
      .add(1);
    instalmentInfo[_proposalId].lastInstalmentCount = instalmentInfo[_proposalId]
      .lastInstalmentCount
      .add(1);
    // close if the instalment is last request
    uint256 totalProposalInstalments = proposal.instalmentMonths;
    if (totalProposalInstalments == instalmentInfo[_proposalId].lastInstalmentCount)
      instalmentInfo[_proposalId].closeProposal = true;
    return true;
  }

  /**
   * @dev To pay delayed installments from collateral
   * @param _proposalId Proposal ID
   * @param _collateralTypeAddress Collateral token address
   * @param _unitPrice Unit price of collateral token
   * @return _success Bool
   */
  function delayPayment(
    uint256 _proposalId,
    address _collateralTypeAddress,
    uint256 _unitPrice
  ) external nonReentrant onlyOwner returns (bool _success) {
    IProposal.ProposalStruct memory proposal = ProposalRegistry(proposalReg).getProposalDetails(
      _proposalId
    );
    require(proposal.isCollateral, '_require isCollateral as true');
    uint256 monthlyAdminShare_Collateral;
    uint256 monthlyUserShare_Collateral;
    IInstalments.InstalmentType txnType;
    if (
      instalmentInfo[_proposalId].colateralInstalmentCount >=
      contractRegistry.delayedInstalmentsCount()
    ) {
      uint256 pendingInstalments = this.calculatePendingInstalments(_proposalId);
      //******************* */
      monthlyAdminShare_Collateral = (
        (proposal.earnings.monthlyAdminShare.mul(_unitPrice)).div(10**contractRegistry.DECIMALS())
      ).mul(pendingInstalments);
      monthlyUserShare_Collateral = (
        (proposal.earnings.monthlyUserShare.mul(_unitPrice)).div(10**contractRegistry.DECIMALS())
      ).mul(pendingInstalments);
      //************************* */

      //*******************CLOSE LOAN METHOD *********/
      txnType = IInstalments.InstalmentType.MULTICOLLATERAL;
      instalmentInfo[_proposalId].closeProposal = true;
      instalmentInfo[_proposalId].delayPaymentClose = true;

      instalmentInfo[_proposalId].lastInstalmentCount = proposal.instalmentMonths;
    } else {
      require(
        proposal.collateralInfo.collateralTypeAddress == _collateralTypeAddress,
        "_collateral address doesn't match"
      );
      //*********************** */
      monthlyAdminShare_Collateral = (proposal.earnings.monthlyAdminShare.mul(_unitPrice)).div(
        10**contractRegistry.DECIMALS()
      );
      monthlyUserShare_Collateral = (proposal.earnings.monthlyUserShare.mul(_unitPrice)).div(
        10**contractRegistry.DECIMALS()
      );
      //******************* */
      txnType = IInstalments.InstalmentType.COLLATERAL;
      instalmentInfo[_proposalId].collateralAsInstalment = true;
      instalmentInfo[_proposalId].colateralInstalmentCount = instalmentInfo[_proposalId]
        .colateralInstalmentCount
        .add(1);
      instalmentInfo[_proposalId].lastInstalmentCount = instalmentInfo[_proposalId]
        .lastInstalmentCount
        .add(1);
    }

    {
      bool userStatus = Vaults(contractRegistry.getIVaultContractAddress()).withdrawCollateral(
        proposal.borrowDetails.borrowerAddress,
        proposal.userId,
        monthlyUserShare_Collateral,
        _proposalId,
        _collateralTypeAddress
      );
      require(userStatus, '_ withdraw monthly collateral to user failed.');
    }
    {
      bool adminStatus = Vaults(contractRegistry.getIVaultContractAddress()).withdrawCollateral(
        proposal.borrowDetails.borrowerAddress,
        contractRegistry.getAdminAddress(),
        monthlyAdminShare_Collateral,
        _proposalId,
        _collateralTypeAddress
      );
      require(adminStatus, '_ withdraw monthly collateral to admin failed.');
    }
    IInstalments.ProposalTransactionStruct memory transaction = IInstalments
      .ProposalTransactionStruct(
        instalmentInfo[_proposalId].lastInstalmentCount + 1,
        block.timestamp,
        proposal.earnings.monthlyUserShare,
        proposal.earnings.monthlyAdminShare,
        IInstalments.InstalmentType.MULTICOLLATERAL,
        IInstalments.TransactionState.SUCCESS
      );
    transactions[_proposalId].push(transaction);

    if (proposal.instalmentMonths == instalmentInfo[_proposalId].lastInstalmentCount) {
      //*******************CLOSE LOAN METHOD **********/
      instalmentInfo[_proposalId].closeProposal = true;
    }
    return true;
  }

  /**
   * @dev To calculate pending collateral amount
   * @param _proposalId Proposal ID
   * @param _unitPrice Unit price of collateral token
   */
  function toCalculatePendingCollateral(uint256 _proposalId, uint256 _unitPrice)
    external
    view
    returns (uint256)
  {
    IProposal.ProposalStruct memory proposal = ProposalRegistry(proposalReg).getProposalDetails(
      _proposalId
    );
    uint256 pendingCollateral;

    if (!proposal.isCollateral) return pendingCollateral;

    uint256 collateralInstalmentCount = instalmentInfo[_proposalId].colateralInstalmentCount;
    if (collateralInstalmentCount >= 1) {
      //Calculate pending collateral
      uint256 monthlyAdminShare_Collateral = (
        (proposal.earnings.monthlyAdminShare.mul(_unitPrice)).div(10**contractRegistry.DECIMALS())
      ).mul(collateralInstalmentCount);
      uint256 monthlyUserShare_Collateral = (
        (proposal.earnings.monthlyUserShare.mul(_unitPrice)).div(10**contractRegistry.DECIMALS())
      ).mul(collateralInstalmentCount);
      uint256 totalCollateralDeposit = (
        proposal.collateralInfo.collateralTokenQuantity.mul(_unitPrice)
      ).div(10**contractRegistry.DECIMALS());
      pendingCollateral = totalCollateralDeposit.sub(
        monthlyAdminShare_Collateral.add(monthlyUserShare_Collateral)
      );
      return (pendingCollateral);
    } else {
      pendingCollateral = (proposal.collateralInfo.collateralTokenQuantity.mul(_unitPrice)).div(
        10**contractRegistry.DECIMALS()
      );
      return pendingCollateral;
    }
  }

  /**
   * @dev To calclate pending instalments.
   * @param _proposalId Proposal ID
   * @return pendingInstalmentCount
   */
  function calculatePendingInstalments(uint256 _proposalId)
    external
    view
    returns (uint256 pendingInstalmentCount)
  {
    IProposal.ProposalStruct memory proposal = ProposalRegistry(proposalReg).getProposalDetails(
      _proposalId
    );
    uint256 totalProposalInstalments = proposal.instalmentMonths;
    uint256 lastPaidInstalments = instalmentInfo[_proposalId].lastInstalmentCount;
    uint256 pendingInstalment = totalProposalInstalments - lastPaidInstalments;
    return pendingInstalment;
  }

  /**
   * @dev To calculate pending tokens based on monthly admin,user,total share
   * @param _proposalId Proposal ID
   * @return pendingTokenAmount
   * @return adminShare_Token
   * @return userShare_Token
   */
  function toCalculatePendingTokens(uint256 _proposalId)
    external
    view
    returns (
      uint256 pendingTokenAmount,
      uint256 adminShare_Token,
      uint256 userShare_Token
    )
  {
    IProposal.ProposalStruct memory proposal = ProposalRegistry(proposalReg).getProposalDetails(
      _proposalId
    );
    uint256 pendingInstalments = this.calculatePendingInstalments(_proposalId);
    uint256 monthlyAdminShare_TokenPaid;
    uint256 monthlyUserShare_TokenPaid;
    uint256 pendingTokenAmountCalcToPay;
    if (pendingInstalments > 0 && pendingInstalments <= proposal.instalmentMonths) {
      //Calculating pending tokens to be paid to close laon
      monthlyAdminShare_TokenPaid = proposal.earnings.monthlyAdminShare.mul(pendingInstalments);
      monthlyUserShare_TokenPaid = proposal.earnings.monthlyUserShare.mul(pendingInstalments);
      pendingTokenAmountCalcToPay = proposal.earnings.monthlyTotalShare.mul(pendingInstalments);
    }
    return (pendingTokenAmountCalcToPay, monthlyAdminShare_TokenPaid, monthlyUserShare_TokenPaid);
  }

  /**
   * @dev To get pending tokens
   * @param _proposalId Proposal ID
   * @return _pendingTokenAmount
   */
  function getPendingTokens(uint256 _proposalId)
    external
    view
    returns (uint256 _pendingTokenAmount)
  {
    IProposal.ProposalStruct memory proposal = ProposalRegistry(proposalReg).getProposalDetails(
      _proposalId
    );
    uint256 pendingInstalments = this.calculatePendingInstalments(_proposalId);
    uint256 monthlyAdminShare_TokenPaid;
    uint256 monthlyUserShare_TokenPaid;
    uint256 pendingTokenAmountCalcToPay;
    if (pendingInstalments > 0 && pendingInstalments <= proposal.instalmentMonths) {
      //Calculating pending tokens to be paid to close laon
      monthlyAdminShare_TokenPaid = proposal.earnings.monthlyAdminShare.mul(pendingInstalments);
      monthlyUserShare_TokenPaid = proposal.earnings.monthlyUserShare.mul(pendingInstalments);
      pendingTokenAmountCalcToPay = proposal.earnings.monthlyTotalShare.mul(pendingInstalments);
    }
    return (pendingTokenAmountCalcToPay);
  }

  /**
   * @dev To pay the tokens fully after this call
   * @param _proposalId Proposal ID
   * @param _amountToPay Amount
   * @param _paymentAddress Token will be debited from this address(user address/joint address)
   * @return _success Bool
   */
  function fullPaymentClose(
    uint256 _proposalId,
    uint256 _amountToPay,
    address _paymentAddress
  ) external nonReentrant returns (bool _success) {
    IProposal.ProposalStruct memory proposal = ProposalRegistry(proposalReg).getProposalDetails(
      _proposalId
    );
    (
      uint256 pendingTokenAmountCalc,
      uint256 monthlyAdminShare_Token,
      uint256 monthlyUserShare_Token
    ) = this.toCalculatePendingTokens(_proposalId);
    require(pendingTokenAmountCalc <= _amountToPay, '_require amount to close loan is not valid');
    require(msg.sender == proposal.borrowDetails.borrowerAddress, '_invalid borrower');

    require(
      _paymentAddress == proposal.borrowDetails.borrowerAddress ||
        IJointAccount(_paymentAddress).isMember(_msgSender()),
      '_invalid payment address'
    );
    uint256 pendingInstalments = this.calculatePendingInstalments(_proposalId);
    bool status = transferShare(
      _paymentAddress,
      proposal.userId,
      proposal.earnings.monthlyUserShare.mul(pendingInstalments),
      proposal.earnings.monthlyAdminShare.mul(pendingInstalments)
    );
    require(status, '_ direct Token transfer failed.');

    IInstalments.ProposalTransactionStruct memory transaction = IInstalments
      .ProposalTransactionStruct(
        instalmentInfo[_proposalId].lastInstalmentCount + 1,
        block.timestamp,
        proposal.earnings.monthlyUserShare.mul(pendingInstalments),
        proposal.earnings.monthlyAdminShare.mul(pendingInstalments),
        IInstalments.InstalmentType.MULTIDIRECT,
        IInstalments.TransactionState.SUCCESS
      );
    transactions[_proposalId].push(transaction);
    instalmentInfo[_proposalId].lastInstalmentCount = proposal.instalmentMonths;
    instalmentInfo[_proposalId].closeProposal = true;
    instalmentInfo[_proposalId].fullPaymentClose = true;
    return true;
  }

  /**
   * @dev To closeProposal by sending collateral back to borrower.
   * @param _proposalId Proposal ID
   * @return success Bool
   */
  function closeProposalRequest(uint256 _proposalId) external onlyOwner returns (bool success) {
    IProposal.ProposalStruct memory proposal = ProposalRegistry(proposalReg).getProposalDetails(
      _proposalId
    );
    require(instalmentInfo[_proposalId].closeProposal, '_Closing proposal is not valid');
    uint256 pendingTokenAmountCalc = this.getPendingTokens(_proposalId);
    require(
      pendingTokenAmountCalc.mul(10**contractRegistry.DECIMALS()) == 0,
      '_pay the remaining token amounts to close loan'
    );
    if (proposal.isCollateral) {
      IVault.Vault memory vaultsInfo = Vaults(contractRegistry.getIVaultContractAddress()).getVault(
        _proposalId,
        proposal.borrowDetails.borrowerAddress
      );
      {
        bool userStatus = Vaults(contractRegistry.getIVaultContractAddress()).refundCollateral(
          address(contractRegistry.getIVaultContractAddress()),
          proposal.borrowDetails.borrowerAddress,
          vaultsInfo.collateralAmount,
          _proposalId,
          proposal.collateralInfo.collateralTypeAddress
        );
        require(userStatus, '_ refund collateral back to user failed.');
      }
    }
    return true;
  }

  /**
   * @dev To verify the proposal close status
   * @param _proposalId Proposal ID
   * @return success Bool
   */
  function closeProposalStatus(uint256 _proposalId) external view returns (bool success) {
    return instalmentInfo[_proposalId].closeProposal;
  }

  /**
   * @dev Internal function to transfer share to user and admin
   * @param _fromAddress From address
   * @param _toAddress To address
   * @param _userShare User share token amount
   * @param _adminShare  Admin share token amount
   * @return success Bool
   */
  function transferShare(
    address _fromAddress,
    address _toAddress,
    uint256 _userShare,
    uint256 _adminShare
  ) internal returns (bool) {
    stableCoin.transferFrom(_fromAddress, _toAddress, _userShare);
    stableCoin.transferFrom(_fromAddress, contractRegistry.getAdminAddress(), _adminShare);
    emit TransferStableCoins(_fromAddress, _toAddress, _userShare);
    emit TransferStableCoins(_fromAddress, contractRegistry.getAdminAddress(), _adminShare);
    return true;
  }

  /**
   * @dev To receive native coin
   */
  receive() external payable {
    emit ReceivedCoin(msg.sender, msg.value);
  }
}
