// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import './interfaces/IEscrow.sol';

/**
 * @dev RTO Escrow Contract
 */
contract RTOEscrow is AccessControlUpgradeable, ReentrancyGuardUpgradeable, OwnableUpgradeable {
  //External Token Contract
  ERC20Upgradeable public stableCoin;

  //Roles definition for depositor,withdrawer,admin
  bytes32 public constant DEPOSITOR_ROLE = keccak256('DEPOSITOR_ROLE');
  bytes32 public constant WITHDRAWER_ROLE = keccak256('WITHDRAWER_ROLE');
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');

  /**
   * @dev Emitted when while the token deposits.
   */
  event DepositStableCoins(address _from, address _to, uint256 _amountOfTokens);
  /**
   * @dev Emitted when while the token withdraws
   */
  event WithdrawStableCoins(address _from, address _to, uint256 _amountOfTokens);
  /**
   * @dev Emitted when while receive RTC
   */
  event ReceivedRTC(address, uint256);

  /**
   * @dev Initializes the contract
   * @param _stableCoinAddress address of the stablecoin
   */
  function initialize(address _stableCoinAddress) public initializer {
    __AccessControl_init();
    __ReentrancyGuard_init();
    __Ownable_init();
    stableCoin = ERC20Upgradeable(_stableCoinAddress);
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
  }

  /**
   * @dev To change the admin role
   * @param _newAddr address of the new admin
   */
  function roleChangeAdmin(address _newAddr) external {
    require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), '_ must have admin role to define role');
    _setupRole(DEFAULT_ADMIN_ROLE, _newAddr);
  }

  /**
   * @dev To change the sub roles
   * @param _depositorAddress address for the depositor
   * @param _withdrawAddress address for the withdrawer
   */
  function updateSubRoles(address _depositorAddress, address _withdrawAddress) external {
    require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), '_ must have admin role to define role');
    _setupRole(DEPOSITOR_ROLE, _depositorAddress);
    _setupRole(WITHDRAWER_ROLE, _withdrawAddress);
  }

  /**
   * @dev To change the stable coin address
   * @param _stableCoinAddress address for the stsble coin
   */
  function updateStableCoinAddress(ERC20Upgradeable _stableCoinAddress) external {
    require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), '_ must have admin role to define role');
    stableCoin = _stableCoinAddress;
  }

  /**
   * @dev To deposit amount
   * @param _fromAddress address of the depositor
   * @param _amountToDeposit deposited token amount
   */
  function deposit(address _fromAddress, uint256 _amountToDeposit)
    external
    nonReentrant
    returns (bool success)
  {
    require(hasRole(DEPOSITOR_ROLE, _msgSender()), '_must have depositor role to deposit');
    stableCoin.transferFrom(_fromAddress, address(this), _amountToDeposit);
    emit DepositStableCoins(_fromAddress, address(this), _amountToDeposit);
    return true;
  }

  /**
   * @dev To withdraw amount
   * @param _toAddress address of the withdrawer
   * @param _amountToWithdraw amount to withdraw
   */
  function withdraw(address _toAddress, uint256 _amountToWithdraw)
    external
    nonReentrant
    returns (bool success)
  {
    require(hasRole(WITHDRAWER_ROLE, _msgSender()), '_must have withdrawer role to withdraw');
    stableCoin.transfer(_toAddress, _amountToWithdraw);
    emit WithdrawStableCoins(address(this), _toAddress, _amountToWithdraw);
    return true;
  }

  /**
   * @dev To get the current available balance
   */
  function getCurrentBalance() public view returns (uint256) {
    return stableCoin.balanceOf(address(this));
  }

  /**
   * @dev receive function
   */
  receive() external payable {
    emit ReceivedRTC(msg.sender, msg.value);
  }
}
