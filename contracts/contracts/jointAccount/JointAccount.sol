// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';

/**
 * @dev Joint Account Contract
 */
contract JointAccount is
  AccessControlEnumerableUpgradeable,
  ReentrancyGuardUpgradeable,
  OwnableUpgradeable
{
  //External Token Contract
  ERC20Upgradeable public stableCoin;
  uint256 public adminShare; //0.1 RTC
  uint256 public adminShareReceived;
  bool public accountStatus;

  address rootAdmin;
  /**
   * @dev Definition of roles in joint accounts
   */
  bytes32 public constant DEPOSIT_ROLE = keccak256('DEPOSIT_ROLE');
  bytes32 public constant WITHDRAW_ROLE = keccak256('WITHDRAW_ROLE');
  bytes32 public constant DEFAULT_ROLE = keccak256('DEFAULT_ROLE');
  bytes32 public constant MULTI_ROLE = keccak256('MULTI_ROLE');
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');

  /**
   * @dev mapping to interact with addresses to determine the address is enabled or disabled
   */
  mapping(address => bool) public isMember;
  address[] public membersList; //memebers list
  address[] public inviteList; //account invitation list

  /**
   * @dev Emitted when a list of members added.
   */
  event MemberAdditionList(address[] indexed _member);
  /**
   * @dev Emitted when replace an owner with a new owner.
   */
  event MemberAddition(address indexed _member);
  /**
   * @dev Emitted when a memeber removed from the list.
   */
  event MemberRemoval(address indexed _member);
  /**
   * @dev Emitted when a token deposits.
   */
  event DepositFunds(address _from, address _to, uint256 _amount);
  /**
   * @dev Emitted when a token withdraws.
   */
  event WithdrawFunds(address _from, address _to, uint256 _amount);
  /**
   * @dev Emitted when an a transfer to another account happens.
   */
  event TransferFunds(address _from, address _to, uint256 _amount);
  /**
   * @dev Emitted when the account receives RTC.
   */
  event ReceivedRTC(address, uint256);

  /**
   * @dev modifeir to verify the member.
   */

  modifier invalidMember(address _member) {
    require(!isMember[_member], 'Member exist.');
    _;
  }
  /**
   * @dev modifeir to verify the member list.
   */

  modifier invalidMemberList(address[] memory _members) {
    for (uint256 i = 0; i < _members.length; i++) {
      require(_members[i] != address(0x0), 'Address is null');
      require(!isMember[_members[i]], 'Member  exist.');
      _;
    }
  }
  /**
   * @dev modifeir to verify the valid member.
   */

  modifier validMember(address _member) {
    require(isMember[_member], 'Member does not exists');
    _;
  }
  /**
   * @dev modifeir to verify the null address.
   */

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

  /**
   * @dev Initializes the contract
   * the creator of the contract is the owner of the joint account
   * @param  _rootAdmin address of the root admin
   * @param  _accountOwner address of the owner
   * @param _members members list of account
   * @param _stableCoinAddress address of the stablecoin
   */
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
    adminShare = 100000000000000000; //0.1 RTC
    accountStatus = true;

    isMember[_accountOwner] = true;
    membersList.push(_accountOwner);

    _setupRole(ADMIN_ROLE, _rootAdmin);
    _setupRole(ADMIN_ROLE, _msgSender());
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

    inviteList = _members;
  }

  /**
   * @dev To reflect the admin changes into the {DEFAULT_ADMIN_ROLE}
   * @param  _newOwner address of the new owner
   */
  function transferOwnership(address _newOwner) public override onlyOwner {
    super.grantRole(DEFAULT_ADMIN_ROLE, _newOwner);
    super.grantRole(ADMIN_ROLE, _newOwner);
    super.revokeRole(ADMIN_ROLE, _msgSender());
    super.renounceRole(DEFAULT_ADMIN_ROLE, _msgSender());
    super.transferOwnership(_newOwner);
  }

  /**
   *  @dev To change the root admin
   * exaclty one root admin is allowed per contract
   * only contract owner have the authority to add, remove or change
   * @param  _newAdmin address of the new admin
   */
  function changeRootAdmin(address _newAdmin) public onlyOwner {
    address oldAdmin = getRoleMember(ADMIN_ROLE, 0);
    super.revokeRole(ADMIN_ROLE, oldAdmin);
    super.grantRole(ADMIN_ROLE, _newAdmin);
  }

  /**
   * @dev To add a new list of memebers
   * @param _members member list
   */
  function addMember(address[] memory _members)
    public
    invalidMemberList(_members)
    onlyOwner
    checkStatus
  {
    for (uint256 i = 0; i < _members.length; i++) {
      bool pushStatus = false;
      for (uint256 j = 0; j < inviteList.length; j++) {
        if (inviteList[j] == _members[i]) {
          pushStatus = true;
          break;
        }
      }
      if (!pushStatus) inviteList.push(_members[i]);
    }
    emit MemberAdditionList(_members);
  }

  /**
   * @dev To remove a new member if the member is a valid.
   * @param _member address of the member
   */
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

  /**
   * @dev To replace an owner with a new owner.
   * @param _owner address of the owner
   * @param _newOwner address of the new owner
   */
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

  /**
   * @dev To accept or reject the status by owner
   * @param _updateStatus accept or reject status as boolean
   */
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
      } else {
        matchCheck = false;
      }
    }
    require(matchCheck, '_invalid member operation');
    _revokeRole(DEFAULT_ROLE, _msgSender());
    return true;
  }

  /**
   * @dev To get the count for the role
   * @param _role role in bytes
   */
  function getRoleMemberCount(bytes32 _role) public view virtual override returns (uint256 _count) {
    return super.getRoleMemberCount(_role);
  }

  /**
   * @dev To get the role member using role and index.
   * @param  _role role in bytes
   * @param _index index
   */
  function getRoleMember(bytes32 _role, uint256 _index)
    public
    view
    virtual
    override
    returns (address _accountOwner)
  {
    return super.getRoleMember(_role, _index);
  }

  /**
   * @dev To grant a new role
   * @param  _role role in bytes
   * @param  _account address of the account
   */
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

  /**
   * @dev To revoke role
   * @param  _role role in bytes
   * @param  _account address of the account
   */
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

  /**
   * @dev To deposit token
   * @param  _fromAddress from address
   * @param  _amountToDeposit amount to deposit
   */
  function depositToken(address _fromAddress, uint256 _amountToDeposit)
    internal
    onlyDepositer
    checkStatus
    nonReentrant
    returns (bool _success)
  {
    require(_fromAddress == _msgSender(), 'Address validation failed');
    stableCoin.approve(address(this), _amountToDeposit);
    stableCoin.transferFrom(_msgSender(), address(this), _amountToDeposit);
    emit DepositFunds(_fromAddress, address(this), _amountToDeposit);
    return (true);
  }

  /**
   * @dev To withdraw token
   * @param  _toAddress to address
   * @param  _amountToWithdraw amount to withdraw
   */
  function withdrawToken(address _toAddress, uint256 _amountToWithdraw)
    internal
    onlyWithdrawer
    checkStatus
    nonReentrant
    returns (bool _success)
  {
    stableCoin.transfer(_toAddress, _amountToWithdraw);
    emit WithdrawFunds(address(this), _toAddress, _amountToWithdraw);
    return (true);
  }

  /**
   * @dev To transfer between accounts
   * status for type of transfer, true-deposit false - withdraw
   * @param  _fromAddress from address
   * @param  _toAddress to address
   * @param  _amount amount to transfer
   * @param  _txnType transaction type as withdraw or deposit
   */
  function p2pTransfer(
    address _fromAddress,
    address _toAddress,
    uint256 _amount,
    bool _txnType
  ) external payable validMember(_msgSender()) checkStatus nonReentrant returns (bool _success) {
    require(msg.value == adminShare, 'Please send the required amount.');
    adminShareReceived += adminShare;
    (bool sendToAdmin, ) = payable(rootAdmin).call{ value: adminShare }('');
    require(sendToAdmin, 'Failed to send admin share');
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

  /**
   * @dev To update the account status
   * @param status status of the account
   */
  function updateAccountStatus(bool status) external onlyOwner returns (bool) {
    accountStatus = status;
    if (!status) _withdrawBalance();
    return (true);
  }

  /**
   * @dev To change the admin share
   * @param _share new share for the admin
   */
  function updateAdminShare(uint256 _share) external onlyOwner {
    adminShare = _share;
  }

  /**
   * @dev To withdraw balance
   */
  function _withdrawBalance() internal nonReentrant returns (bool) {
    stableCoin.transfer(owner(), this.getCurrentBalance());
    emit WithdrawFunds(address(this), owner(), this.getCurrentBalance());
    return (true);
  }

  /**
   * @dev To withdraw balance
   */
  function withdrawBalance() external onlyOwner {
    _withdrawBalance();
  }

  /**
   * @dev To approve the account for the amount transfer
   * @param _spender address of the spender
   * @param _amount amount to approve
   */
  function approve(address _spender, uint256 _amount) public virtual onlyWithdrawer returns (bool) {
    stableCoin.approve(_spender, _amount);
    return true;
  }

  /**
   * @dev To get the list of owner addresses.
   */
  function getMembers() public view returns (address[] memory) {
    return membersList;
  }

  /**
   * @dev To get the count of owner addresses.
   */
  function getMembersCount() public view returns (uint256 _count) {
    return membersList.length;
  }

  /**
   * @dev To get the list of invites send.
   */
  function getInvites() public view returns (address[] memory) {
    return inviteList;
  }

  /**
   * @dev To get the current balance
   */
  function getCurrentBalance() public view returns (uint256) {
    return stableCoin.balanceOf(address(this));
  }

  /**
   * @dev To get the admin share
   */
  function getAdminShare() external view returns (uint256) {
    return adminShare;
  }

  /**
   * @dev receive funtion
   */
  receive() external payable {
    emit ReceivedRTC(msg.sender, msg.value);
  }
}
