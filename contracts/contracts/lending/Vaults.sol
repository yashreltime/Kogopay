// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import './interfaces/IVault.sol';
import './interfaces/IEscrow.sol';

/**
 * @dev Vault Contract
 */
contract Vaults is ReentrancyGuardUpgradeable, OwnableUpgradeable {
  /**
   * @dev mapping for tracking deposit and withdraw details
   */
  mapping(uint256 => mapping(address => IVault.Vault)) vaults;
  /**
   * @dev enum type for deposit and withdraw
   */
  enum Type {
    DEPOSIT_TOKEN,
    WITHDRAW_TOKEN,
    REFUND_TOKEN,
    DEPOSIT_COLLATERAL,
    WITHDRAW_COLLATERAL,
    REFUND_COLLATERAL
  }

  /**
   * @dev Emitted when while the token deposits.
   */
  event DepositToken(address, address, uint256, Type);
  /**
   * @dev Emitted when while the token withdraws.
   */
  event WithdrawToken(address, address, uint256, Type);
  /**
   * @dev Emitted when while receive RTC
   */
  event ReceivedRTC(address, uint256);

  // External contract address
  IEscrow escrow;

  /**
   * @dev Initializes the contract
   * @param _escrowAddr address of the escrow
   */
  function initialize(address _escrowAddr) public initializer {
    __ReentrancyGuard_init();
    __Ownable_init();
    escrow = IEscrow(_escrowAddr);
  }

  /**
   * @dev To Update Stablecoin Escrow address
   * @param _escrowAddr address of the escrow
   */
  function updateEscrowCoinAddress(address _escrowAddr) external onlyOwner {
    escrow = IEscrow(_escrowAddr);
  }

  /**
   * @dev  To get the Vault based on Id and address
   * @param _proposalId Id of the proposal
   * @param _userAddress address of the user
   */
  function getVault(uint256 _proposalId, address _userAddress)
    external
    view
    returns (IVault.Vault memory vault)
  {
    return vaults[_proposalId][_userAddress];
  }

  /**
   * @dev  To deposit token (Stablecoin) by borrower
   * @param _fromAddress from address
   * @param _toAddress to address
   * @param _amountToDeposit amount to deposit
   * @param _proposalId proposal Id
   */
  function depositToken(
    address _fromAddress,
    address _toAddress,
    uint256 _amountToDeposit,
    uint256 _proposalId
  ) external nonReentrant returns (bool success) {
    vaults[_proposalId][_fromAddress].debtAmount += _amountToDeposit;
    escrow.deposit(_fromAddress, _amountToDeposit);
    emit DepositToken(_fromAddress, _toAddress, _amountToDeposit, Type.DEPOSIT_TOKEN);
    return true;
  }

  /**
   * @dev To withdraw/share token to borrower from lender
   * @param _fromAddress from address
   * @param _toAddress to address
   * @param _amountToDeposit amount to deposit
   * @param _proposalId proposal Id
   */
  function withdrawToken(
    address _fromAddress,
    address _toAddress,
    uint256 _amountToDeposit,
    uint256 _proposalId
  ) external nonReentrant returns (bool success) {
    require(
      vaults[_proposalId][_fromAddress].debtAmount >= _amountToDeposit,
      '_amount is not available in vault'
    );
    vaults[_proposalId][_fromAddress].debtAmount -= _amountToDeposit;
    escrow.withdraw(_toAddress, _amountToDeposit);
    emit WithdrawToken(_fromAddress, _toAddress, _amountToDeposit, Type.WITHDRAW_TOKEN);
    return true;
  }

  /**
   * @dev To refund token to borrower
   * @param _fromAddress from address
   * @param _toAddress to address
   * @param _amountToDeposit amount to deposit
   * @param _proposalId proposal Id
   */
  function refundToken(
    address _fromAddress,
    address _toAddress,
    uint256 _amountToDeposit,
    uint256 _proposalId
  ) external nonReentrant returns (bool success) {
    require(
      vaults[_proposalId][_toAddress].debtAmount >= _amountToDeposit,
      '_amount is not available in vault'
    );
    vaults[_proposalId][_toAddress].debtAmount -= _amountToDeposit;
    escrow.withdraw(_toAddress, _amountToDeposit);
    emit WithdrawToken(_fromAddress, _toAddress, _amountToDeposit, Type.REFUND_TOKEN);
    return true;
  }

  /**
   * @dev To deposit collateral by borrower
   * @param _fromAddress from addres
   * @param _toAddress to address
   * @param _amountToDeposit amount to deposit
   * @param _proposalId proposal Id
   */
  function depositCollateral(
    address _fromAddress,
    address _toAddress,
    uint256 _amountToDeposit,
    uint256 _proposalId
  ) external payable nonReentrant returns (bool success) {
    vaults[_proposalId][_fromAddress].collateralAmount += _amountToDeposit;
    vaults[_proposalId][_fromAddress].collateralType = _toAddress;
    IEscrow(_toAddress).deposit(_fromAddress, _amountToDeposit);
    emit DepositToken(_fromAddress, _toAddress, _amountToDeposit, Type.DEPOSIT_COLLATERAL);
    return true;
  }

  /**
   * @dev To withdraw  borrower's collateral to lender
   * @param _fromAddress from address
   * @param _toAddress to address
   * @param _amountToWithdraw amount to withdraw
   * @param _proposalId proposal Id
   * @param _collateralTypeAddress collateral address
   */
  function withdrawCollateral(
    address _fromAddress,
    address _toAddress,
    uint256 _amountToWithdraw,
    uint256 _proposalId,
    address _collateralTypeAddress
  ) external nonReentrant returns (bool success) {
    require(
      vaults[_proposalId][_fromAddress].collateralAmount >= _amountToWithdraw,
      '_collateral amount is not available in vault'
    );
    vaults[_proposalId][_fromAddress].collateralAmount -= _amountToWithdraw;
    IEscrow(_collateralTypeAddress).withdraw(_toAddress, _amountToWithdraw);
    emit WithdrawToken(_fromAddress, _toAddress, _amountToWithdraw, Type.WITHDRAW_COLLATERAL);
    return true;
  }

  /**
   * @dev  To refund the collateral back to lender
   * @param _fromAddress from address
   * @param _toAddress to address
   * @param _amountToWithdraw amount to withdraw
   * @param _proposalId proposal Id
   * @param _collateralTypeAddress collateral address
   */
  function refundCollateral(
    address _fromAddress,
    address _toAddress,
    uint256 _amountToWithdraw,
    uint256 _proposalId,
    address _collateralTypeAddress
  ) external nonReentrant returns (bool success) {
    require(
      vaults[_proposalId][_toAddress].collateralAmount >= _amountToWithdraw,
      '_collateral amount is not available in vault'
    );
    vaults[_proposalId][_toAddress].collateralAmount -= _amountToWithdraw;
    IEscrow(_collateralTypeAddress).withdraw(_toAddress, _amountToWithdraw);
    emit WithdrawToken(_fromAddress, _toAddress, _amountToWithdraw, Type.REFUND_COLLATERAL);
    return true;
  }

  /**
   * @dev receive function
   */
  receive() external payable {
    emit ReceivedRTC(msg.sender, msg.value);
  }
}
