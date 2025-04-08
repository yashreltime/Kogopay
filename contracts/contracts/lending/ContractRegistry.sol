// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import './Vaults.sol';
import './interfaces/IEscrow.sol';
import './ProposalRequestRegistry.sol';
import './PaymentRegistry.sol';
import './interfaces/IContract.sol';

/**
 * @dev Contract Registry Contract
 */
contract ContractRegistry is OwnableUpgradeable {
  /**
   * @dev struct definition for keeping addresses
   */
  struct AddrManager {
    ERC20Upgradeable coinContractaddr;
    IEscrow escrowContractAddr;
    Vaults vaultContractAddr;
    ProposalRequestRegistry proposalContractAddr;
    PaymentRegistry paymentContractAddr;
    address adminUserAddr;
  }
  AddrManager public addrmanager;

  uint256 public DECIMALS;
  uint256 public adminShare; //admin share percentage
  uint256 public collateralPercentage; //collateral percentage
  uint256 public collateralInterestChange; //collateral interest change
  uint256 public delayedInstalmentsCount; //count for the allowed delayed status
  bool public addrStatus;

  /**
   * @dev Initializes the contract
   * @param _decimals decimal allowed
   */
  function initialize(uint256 _decimals) public initializer {
    DECIMALS = _decimals;
    adminShare = 20 * 10**(DECIMALS - 2); //.02  //2%
    collateralPercentage = 100 * 10**(DECIMALS); //100%
    collateralInterestChange = 2;
    delayedInstalmentsCount = 2;
    __Ownable_init();
  }

  /**
   * @dev To update the contract addresses in addrmanager
   * @param _addrCoin1 address of the stable coin
   * @param _addrVault2 address of the vault contract
   * @param _addrEscrow3 address of the escrow contract
   * @param _addrProposal4 address of the proposal regsitry contract
   * @param _addrPayment5 address of the payment registry contract
   */
  function updateContractAddress(
    ERC20Upgradeable _addrCoin1,
    Vaults _addrVault2,
    IEscrow _addrEscrow3,
    ProposalRequestRegistry _addrProposal4,
    PaymentRegistry _addrPayment5,
    address _addrAdmin6
  ) external onlyOwner {
    addrmanager.coinContractaddr = _addrCoin1;
    addrmanager.vaultContractAddr = _addrVault2;
    addrmanager.escrowContractAddr = _addrEscrow3;
    addrmanager.proposalContractAddr = _addrProposal4;
    addrmanager.paymentContractAddr = _addrPayment5;
    addrmanager.adminUserAddr = _addrAdmin6;
    addrStatus = true;
  }

  /**
   * @dev To get the escrow address
   */
  function getIEscrowContractAddress() public view returns (IEscrow _addr) {
    return addrmanager.escrowContractAddr;
  }

  /**
   * @dev To get the vault address
   */
  function getIVaultContractAddress() public view returns (Vaults _addr) {
    return addrmanager.vaultContractAddr;
  }

  /**
   * @dev To get the proposal contract address
   */
  function getProposalContractAddress() public view returns (ProposalRequestRegistry _addr) {
    return addrmanager.proposalContractAddr;
  }

  /**
   * @dev To get the admin address
   */
  function getAdminAddress() public view returns (address _addr) {
    return addrmanager.adminUserAddr;
  }

  /**
   * @dev To update the decimals
   * @param _decimals decimals allowed
   */
  function updateDecimals(uint256 _decimals) external onlyOwner returns (bool _status) {
    DECIMALS = _decimals;
    return true;
  }

  /**
   * @dev To update the admin share
   * @param _share admin share allowed
   */
  function updateAdminShare(uint256 _share) external onlyOwner returns (bool _status) {
    adminShare = _share;
    return true;
  }

  /**
   * @dev To update the collateral percentage
   * @param _percentage collateral percentage allowed
   */
  function updateCollateralPercentage(uint256 _percentage)
    external
    onlyOwner
    returns (bool _status)
  {
    collateralPercentage = _percentage;
    return true;
  }

  /**
   * @dev To update collateral interest percentage change
   * @param _interestChange interest change allowed
   */
  function updateCollateralInterestChange(uint256 _interestChange)
    external
    onlyOwner
    returns (bool _status)
  {
    collateralInterestChange = _interestChange;
    return true;
  }

  /**
   * @dev To update delayed Instalments count
   * @param _delayedCount delayed count of payments allowed
   */
  function updateDelayedInstalmentsCount(uint256 _delayedCount)
    external
    onlyOwner
    returns (bool _status)
  {
    delayedInstalmentsCount = _delayedCount;
    return true;
  }

  /**
   * @dev To get contract parameters
   */
  function getContractParameters()
    external
    view
    returns (
      uint256 _adminShare,
      uint256 _collateralPercent,
      uint256 _collateralInterest,
      uint256 _delayedInstalmentsCount
    )
  {
    return (adminShare, collateralPercentage, collateralInterestChange, delayedInstalmentsCount);
  }
}
