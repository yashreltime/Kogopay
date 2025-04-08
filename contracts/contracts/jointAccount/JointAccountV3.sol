// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '../lending/PaymentRegistry.sol';

contract JointAccountV3 is OwnableUpgradeable, AccessControlEnumerableUpgradeable {
  /**
   *  Storage
   */
  //External Token Contract
  ERC20Upgradeable public stableCoin;
  uint256 public adminShare; //0.1 RTC
  uint256 public adminShareReceived;
  bool public accountStatus;

  address rootAdmin;

  bytes32 public constant DEPOSIT_ROLE = keccak256('DEPOSIT_ROLE');
  bytes32 public constant WITHDRAW_ROLE = keccak256('WITHDRAW_ROLE');
  bytes32 public constant DEFAULT_ROLE = keccak256('DEFAULT_ROLE');
  bytes32 public constant MULTI_ROLE = keccak256('MULTI_ROLE');
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');

  //mapping to interact with addresses
  //to determine the address is enabled or disabled
  mapping(address => bool) public isMember;
  address[] public membersList;
  address[] public inviteList;

  /**
   *  Events
   */
  event MemberAdditionList(address[] indexed _member);
  event MemberAddition(address indexed _member);
  event MemberRemoval(address indexed _member);
  event DepositFunds(address _from, address _to, uint256 _amount);
  event WithdrawFunds(address _from, address _to, uint256 _amount);
  event TransferFunds(address _from, address _to, uint256 _amount);
  event ReceivedRTC(address, uint256);

  /**
   *  Modifiers
   */

  modifier invalidMember(address _member) {
    require(!isMember[_member], 'Member exist.');
    _;
  }
  modifier invalidMemberList(address[] memory _members) {
    for (uint256 i = 0; i < _members.length; i++) {
      require(_members[i] != address(0x0), 'Address is null');
      require(!isMember[_members[i]], 'Member  exist.');
      _;
    }
  }

  modifier validMember(address _member) {
    require(isMember[_member], 'Member does not exists');
    _;
  }

  modifier notNull(address _address) {
    require(_address != address(0x0), 'Address is null');
    _;
  }

  /**
   * @dev modifier to check admin rights.
   * contract owner and root admin have admin rights
   */
  modifier onlyAdmin() {
    require(
      hasRole(ADMIN_ROLE, _msgSender()) || owner() == _msgSender(),
      'Restricted to admins only.'
    );
    _;
  }

  /**
   * @dev modifier to check deposit rights.
   * contract owner, root admin and depositer's have deposit rights
   */
  modifier onlyDepositer() {
    require(
      hasRole(ADMIN_ROLE, _msgSender()) ||
        hasRole(DEPOSIT_ROLE, _msgSender()) ||
        owner() == _msgSender(),
      'Restricted to members with deposit role.'
    );
    _;
  }

  /**
   * @dev modifier to check withdraw rights.
   * contract owner, root admin and withdrawers's have withdraw rights
   */
  modifier onlyWithdrawer() {
    require(
      hasRole(ADMIN_ROLE, _msgSender()) ||
        hasRole(WITHDRAW_ROLE, _msgSender()) ||
        owner() == _msgSender(),
      'Restricted to members with withdraw role.'
    );
    _;
  }

  /**
   * @dev modifier to check the account status
   */
  modifier checkStatus() {
    require(accountStatus, 'Account is inactive');
    _;
  }

  //the creator of the contract is the owner of the joint account
  function initialize(
    address _rootAdmin,
    address _accountOwner,
    address[] memory _members,
    address _stableCoinAddress
  ) public initializer {
    __Ownable_init();
    rootAdmin = _rootAdmin;
    stableCoin = ERC20Upgradeable(_stableCoinAddress);
    adminShare = 0; //0 RTC
    accountStatus = true;

    isMember[_accountOwner] = true;
    membersList.push(_accountOwner);

    _setupRole(ADMIN_ROLE, _rootAdmin);
    _setupRole(ADMIN_ROLE, _msgSender());
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

    inviteList = _members;
  }

  /**
   * function to reflect the admin changes into the {DEFAULT_ADMIN_ROLE}
   */
  function transferOwnership(address _newOwner) public override onlyOwner {
    super.grantRole(DEFAULT_ADMIN_ROLE, _newOwner);
    super.grantRole(ADMIN_ROLE, _newOwner);
    super.revokeRole(ADMIN_ROLE, _msgSender());
    super.renounceRole(DEFAULT_ADMIN_ROLE, _msgSender());
    super.transferOwnership(_newOwner);
  }

  /**
   * This function is to change the root admin
   * exaclty one root admin is allowed per contract
   * only contract owner have the authority to add, remove or change
   */
  function changeRootAdmin(address _newAdmin) public onlyOwner {
    address oldAdmin = getRoleMember(ADMIN_ROLE, 0);
    super.revokeRole(ADMIN_ROLE, oldAdmin);
    super.grantRole(ADMIN_ROLE, _newAdmin);
  }

  // Allows to add a new owner.
  function addMember(address[] memory _members)
    public
    invalidMemberList(_members)
    onlyOwner
    checkStatus
  {
    for (uint256 i = 0; i < _members.length; i++) {
      bool pushStatus = false;
      for (uint256 j = 0; j < inviteList.length; j++) {
        //require(inviteList[j] != _members[i], 'Already sent an invitation');
        if (inviteList[j] == _members[i]) {
          pushStatus = true;
          break;
        }
      }
      if (!pushStatus) inviteList.push(_members[i]);
    }
    emit MemberAdditionList(_members);
  }

  // Allows to remove an owner.
  // validMember(_owner)
  function removeMember(address _member) public onlyOwner validMember(_member) checkStatus {
    bool matchCheck;
    for (uint256 i = 0; i < membersList.length; i++) {
      if (membersList[i] == _member) {
        matchCheck = true;
        membersList[i] = membersList[membersList.length - 1];
        isMember[_member] = false;
        break;
      } else {
        matchCheck = false;
      }
    }
    require(matchCheck, '_invalid member');
    membersList.pop();
    super.revokeRole(DEFAULT_ROLE, _member);
    super.revokeRole(DEPOSIT_ROLE, _member);
    super.revokeRole(WITHDRAW_ROLE, _member);
    emit MemberRemoval(_member);
  }

  // Allows to replace an owner with a new owner.
  function replaceOwner(address _owner, address _newOwner)
    public
    validMember(_owner)
    invalidMember(_newOwner)
    onlyOwner
    checkStatus
  {
    for (uint256 i = 0; i < membersList.length; i++)
      if (membersList[i] == _owner) {
        membersList[i] = _newOwner;
        break;
      }
    isMember[_owner] = false;
    isMember[_newOwner] = true;
    super.grantRole(ADMIN_ROLE, _newOwner);
    super.revokeRole(ADMIN_ROLE, _owner);
    emit MemberRemoval(_owner);
    emit MemberAddition(_newOwner);
  }

  //to accept or reject the status by owner
  function statusUpdateByMember(bool _updateStatus)
    external
    invalidMember(_msgSender())
    checkStatus
    returns (bool _status)
  {
    bool matchCheck;
    for (uint256 i = 0; i < inviteList.length; i++) {
      if (inviteList[i] == _msgSender()) {
        matchCheck = true;
        inviteList[i] = inviteList[inviteList.length - 1];
        inviteList.pop();
        if (_updateStatus) {
          membersList.push(_msgSender());
          isMember[_msgSender()] = _updateStatus;
        }
        break;
        //false()
      } else {
        matchCheck = false;
      }
    }
    require(matchCheck, '_invalid member operation');
    _revokeRole(DEFAULT_ROLE, _msgSender());
    return true;
  }

  //to get the count for the role
  function getRoleMemberCount(bytes32 _role) public view virtual override returns (uint256 _count) {
    return super.getRoleMemberCount(_role);
  }

  //to get the role member uisng role and index.
  function getRoleMember(bytes32 _role, uint256 _index)
    public
    view
    virtual
    override
    returns (address _accountOwner)
  {
    return super.getRoleMember(_role, _index);
  }

  //To grant a new role
  function grantRoleAccess(bytes32 _role, address _account)
    external
    onlyOwner
    checkStatus
    validMember(_account)
  {
    require(isMember[_account], 'Invalid user account.');
    if (_role == keccak256('MULTI_ROLE')) {
      super.grantRole(DEPOSIT_ROLE, _account);
      super.grantRole(WITHDRAW_ROLE, _account);
    } else {
      super.grantRole(_role, _account);
    }
  }

  //To revoke role
  function revokeRoleAccess(bytes32 _role, address _account)
    external
    onlyOwner
    checkStatus
    validMember(_account)
  {
    require(isMember[_account], 'Invalid user account.');

    if (_role == keccak256('MULTI_ROLE')) {
      super.revokeRole(DEPOSIT_ROLE, _account);
      super.revokeRole(WITHDRAW_ROLE, _account);
    } else {
      super.revokeRole(_role, _account);
    }
  }

  //To deposit token
  function depositToken(address _fromAddress, uint256 _amountToDeposit)
    internal
    onlyDepositer
    checkStatus
    returns (bool _success)
  {
    require(_fromAddress == _msgSender(), 'Address validation failed');
    ERC20Upgradeable(stableCoin).approve(address(this), _amountToDeposit);
    ERC20Upgradeable(stableCoin).transferFrom(_msgSender(), address(this), _amountToDeposit);
    emit DepositFunds(_fromAddress, address(this), _amountToDeposit);
    return (true);
  }

  //To withdraw token
  function withdrawToken(address _toAddress, uint256 _amountToWithdraw)
    internal
    onlyWithdrawer
    checkStatus
    returns (bool _success)
  {
    ERC20Upgradeable(stableCoin).transfer(_toAddress, _amountToWithdraw);
    emit WithdrawFunds(address(this), _toAddress, _amountToWithdraw);
    return (true);
  }

  //To transfer between accoounts
  //bool true-deposit
  // false - withdraw
  function p2pTransfer(
    address _fromAddress,
    address _toAddress,
    uint256 _amount,
    bool _txnType
  ) external payable validMember(_msgSender()) checkStatus returns (bool _success) {
    // require(msg.value == adminShare, 'Please send the required amount.');
    // adminShareReceived += adminShare;
    // (bool sendToAdmin, ) = payable(rootAdmin).call{ value: adminShare }('');
    // require(sendToAdmin, 'Failed to send admin share');
    if (_txnType) {
      bool status = depositToken(_fromAddress, _amount);
      require(status, 'Failed to deposit funds');
      emit TransferFunds(_fromAddress, _toAddress, _amount);
    } else {
      bool status = withdrawToken(_toAddress, _amount);
      require(status, 'Failed to withdraw funds');
      emit TransferFunds(_fromAddress, _toAddress, _amount);
    }

    return (true);
  }

  //To get the list of owner addresses.
  function getMembers() public view returns (address[] memory) {
    return membersList;
  }

  //To get the count of owner addresses.
  function getMembersCount() public view returns (uint256 _count) {
    return membersList.length;
  }

  //To get the list of invites send.
  function getInvites() public view returns (address[] memory) {
    return inviteList;
  }

  //To get the current balance
  function getCurrentBalance() public view returns (uint256) {
    return ERC20Upgradeable(stableCoin).balanceOf(address(this));
  }

  function updateAdminShare(uint256 _share) external onlyOwner {
    adminShare = _share;
  }

  function getAdminShare() external view returns (uint256) {
    return adminShare;
  }

  function updateAccountStatus(bool status) external onlyOwner returns (bool) {
    accountStatus = status;
    if (!status) _withdrawBalance();
    return (true);
  }

  function _withdrawBalance() internal returns (bool) {
    ERC20Upgradeable(stableCoin).transfer(owner(), this.getCurrentBalance());
    emit WithdrawFunds(address(this), owner(), this.getCurrentBalance());
    return (true);
  }

  function withdrawBalance() external onlyOwner {
    _withdrawBalance();
  }

  //approve function to be used only by withd
  function approve(address _spender, uint256 _amount) public virtual onlyWithdrawer returns (bool) {
    ERC20Upgradeable(stableCoin).approve(_spender, _amount);
    return true;
  }

  /**
   * @notice receive function
   */
  receive() external payable {
    emit ReceivedRTC(msg.sender, msg.value);
  }
}
