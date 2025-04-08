// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import './Vaults.sol';
import './interfaces/IProposal.sol';
import './ContractRegistry.sol';
import './UserRegistry.sol';

/**
    @title ProposalRegistry
*/
contract ProposalRegistry is
  ReentrancyGuardUpgradeable,
  OwnableUpgradeable,
  UserRegistry,
  IProposal
{
  using SafeMathUpgradeable for uint256;

  ContractRegistry contractRegistry;
  mapping(uint256 => ProposalStruct) public proposalStructs;
  uint256[] public proposalList;

  event LogCreateProposal(uint256 proposalId);
  event LogUpdateProposal(uint256 proposalId);
  event LogProposalDeleted(uint256 proposalId);

  /**
     @dev Function to get the count of proposals
     @return _proposalCount Total number of proposals
  */
  function getProposalCount() public view returns (uint256 _proposalCount) {
    return proposalList.length;
  }

  /**
    @dev Function to verify the proposal is valid or not
    @param proposalId Proposal ID
    @return _isIndeed
  */
  function isProposal(uint256 proposalId) public view returns (bool _isIndeed) {
    if (proposalList.length == 0) return false;
    if (proposalStructs[proposalId].proposalListPointer == proposalList.length) return false;
    else if (proposalList[proposalStructs[proposalId].proposalListPointer] == proposalId)
      return true;
    else return false;
  }

  /**
    @dev Function to get proposal owner
    @param _proposalId Proposal ID
    @return _owner Owner address
  */
  function getProposalOwner(uint256 _proposalId) external view returns (address _owner) {
    require(isProposal(_proposalId), "_propsal id doesn't exists");
    return proposalStructs[_proposalId].userId;
  }

  /**
    @dev Function to create proposal
    @param _proposalId Proposal ID
    @param _amount Lending amount
    @param _totalAmount Principal amount + interest
    @param _interestRate Intrest rate
    @param _instalmentMonths Duration
    @param _isCollateral Need collateral or not
    @param _isDirect Direct lending or not
    @param _isDirectAddress For direct lending
    @return isIndeed
  */
  function createProposal(
    uint256 _proposalId,
    uint256 _amount,
    uint256 _totalAmount,
    uint256 _interestRate,
    uint256 _instalmentMonths,
    bool _isCollateral,
    bool _isDirect,
    address _isDirectAddress
  ) external nonReentrant returns (bool) {
    require(isUser(msg.sender), '_user is not registered');
    require(!isProposal(_proposalId), '_proposal already exists');
    //Basic conditions
    require(
      !_isDirect || (_isDirect && isUser(_isDirectAddress)),
      '_direct user is not registered'
    );
    {
      //To deposit token
      bool status = Vaults(contractRegistry.getIVaultContractAddress()).depositToken(
        msg.sender,
        address(contractRegistry.getIEscrowContractAddress()),
        _amount,
        _proposalId
      );
      require(status, '_Token transfer failed.');
    }
    //Add new proposalId
    proposalList.push(_proposalId);
    //Initial Insert
    initialInsertOper(
      _proposalId,
      msg.sender,
      _amount,
      _totalAmount,
      _interestRate,
      _instalmentMonths,
      _isCollateral,
      _isDirect,
      _isDirectAddress,
      true
    );
    emit LogCreateProposal(_proposalId);
    return true;
  }

  /**
    @dev Initial function call to create proposal
    @param _proposalId Proposal ID
    @param _creator Lender address
    @param _amount Lending amount
    @param _totalAmount Principal amount + interest
    @param _interestRate Intrest rate
    @param _instalmentMonths Duration
    @param _isCollateral Need collateral or not
    @param _isDirect Direct lending or not
    @param _isDirectAddress For direct lending
    @param _operationType create or update
  */
  function initialInsertOper(
    uint256 _proposalId,
    address _creator,
    uint256 _amount,
    uint256 _totalAmount,
    uint256 _interestRate,
    uint256 _instalmentMonths,
    bool _isCollateral,
    bool _isDirect,
    address _isDirectAddress,
    bool _operationType
  ) internal {
    /// Calling internal function to create proposal
    insertOper(
      _proposalId,
      _creator,
      _amount,
      _interestRate,
      _instalmentMonths,
      _isCollateral,
      _isDirect,
      _isDirectAddress,
      _operationType
    );
    /// Define Internal structs
    EarningsStruct memory earnings = this.calcEarningsTable(
      _amount,
      _totalAmount,
      _interestRate,
      _instalmentMonths
    );
    /// Update the earnings in proposal struct
    proposalStructs[_proposalId].earnings = earnings;
  }

  /**
    @dev Internal Function to insert in struct
    @param _proposalId Proposal ID
    @param _creator Lender address
    @param _amount Lending amount
    @param _interestRate Intrest rate
    @param _instalmentMonths Duration
    @param _isCollateral Need collateral or not
    @param _isDirect Direct lending or not
    @param _isDirectAddress For direct lending
    @param _operationType create or update
  */
  function insertOper(
    uint256 _proposalId,
    address _creator,
    uint256 _amount,
    uint256 _interestRate,
    uint256 _instalmentMonths,
    bool _isCollateral,
    bool _isDirect,
    address _isDirectAddress,
    bool _operationType
  ) internal {
    proposalStructs[_proposalId].proposalListPointer = proposalList.length - 1;
    proposalStructs[_proposalId].userId = _creator;
    //Assign Values
    proposalStructs[_proposalId].proposalId = _proposalId;
    proposalStructs[_proposalId].amount = _amount;
    proposalStructs[_proposalId].interestRate = _interestRate;
    proposalStructs[_proposalId].instalmentMonths = _instalmentMonths;
    proposalStructs[_proposalId].datesInfo.createdDate = block.timestamp;
    proposalStructs[_proposalId].datesInfo.updatedDate = block.timestamp;
    proposalStructs[_proposalId].isCollateral = _isCollateral;
    proposalStructs[_proposalId].isDirectInfo.isDirect = _isDirect;
    proposalStructs[_proposalId].isDirectInfo.isDirectAddress = _isDirectAddress;
    proposalStructs[_proposalId].proposalState = ProposalState.ACTIVE;
    proposalStructs[_proposalId].borrowDetails.borrowState = BorrowState.INACTIVE;
    proposalStructs[_proposalId].borrowDetails.receivedAmountStatus = false;
    if (!_isCollateral) {
      proposalStructs[_proposalId].collateralInfo.collateralState = CollateralState.INVALID;
    } else {
      proposalStructs[_proposalId].collateralInfo.collateralState = CollateralState.PENDING;
    }
    if (_isDirect) {
      userStructs[_isDirectAddress].pendingRequests.push(_proposalId);
    }
    if (_operationType) {
      // Adding the list of proposals that refer to the user for the first insert
      userStructs[_creator].proposalIds.push(_proposalId);
      userStructs[_creator].proposalIdPointers[_proposalId] =
        userStructs[msg.sender].proposalIds.length -
        1;
    }
  }

  /**
    @dev External funtion to calculate principal amount & share
    @param _principalAmount Lending amount
    @param _totalAmount Principal amount + interest
    @param _intrestRate Intrest rate
    @param _installmentMonths Duration
    @param earnings Earnings parameters
  */
  function calcEarningsTable(
    uint256 _principalAmount,
    uint256 _totalAmount,
    uint256 _intrestRate,
    uint256 _installmentMonths
  ) external view returns (EarningsStruct memory earnings) {
    /// Amortized loan calculation
    uint256 intrestAmount = _totalAmount.sub(_principalAmount);
    uint256 totalAmount = _totalAmount;
    uint256 adminSharePercent = contractRegistry.adminShare();
    uint256 totalAdminShare = intrestAmount.mul(adminSharePercent);
    uint256 totalUserShare = totalAmount.sub(totalAdminShare.div(10**contractRegistry.DECIMALS()));
    uint256 monthlyUserShare = totalUserShare.div(_installmentMonths);
    if (totalUserShare.mod(_installmentMonths) >= 2) monthlyUserShare = monthlyUserShare.add(1);
    uint256 monthlyAdminShare = totalAdminShare.div(_installmentMonths);
    if (totalUserShare.mod(_installmentMonths) >= 2) monthlyAdminShare = monthlyAdminShare.add(1);
    uint256 monthlyTotalShare = (monthlyAdminShare.div(10**contractRegistry.DECIMALS())).add(
      monthlyUserShare
    );
    return
      EarningsStruct(
        intrestAmount,
        totalAmount,
        totalAdminShare.div(10**contractRegistry.DECIMALS()),
        monthlyAdminShare.div(10**contractRegistry.DECIMALS()),
        totalUserShare,
        monthlyUserShare,
        monthlyTotalShare,
        0
      );
  }

  /**
    @dev Function to update proposal
    @param _proposalId Proposal ID
    @param _amount Lending amount
    @param _totalAmount Principal amount + interest
    @param _interestRate Intrest rate
    @param _installmentMonths Duration
    @param _isCollateral Need collateral or not
    @param _isDirect Direct lending or not
    @param _isDirectAddress For direct lending
    @return success
  */
  function updateProposal(
    uint256 _proposalId,
    uint256 _amount,
    uint256 _totalAmount,
    uint256 _interestRate,
    uint256 _installmentMonths,
    bool _isCollateral,
    bool _isDirect,
    address _isDirectAddress
  ) external returns (bool success) {
    //Basic Conditions
    require(isUser(msg.sender), '_user is not registered.');
    require(isProposal(_proposalId), '_propsal id not available.');
    require(
      proposalStructs[_proposalId].userId == msg.sender,
      '_only the proposal owner can update.'
    );
    //Proposal State Verification
    require(
      proposalStructs[_proposalId].proposalState == ProposalState.ACTIVE,
      '_proposal is assigned to borrower.'
    );
    require(
      proposalStructs[_proposalId].borrowDetails.borrowState == BorrowState.INACTIVE,
      '_proposal is assigned to borrower.'
    );

    //Basic conditions
    require(
      !_isDirect || (_isDirect && isUser(_isDirectAddress)),
      '_direct user is not registered'
    );
    //Amount Recalculation
    if (proposalStructs[_proposalId].amount != _amount) {
      bool status = isUpdateAmountRecalc(msg.sender, _proposalId, _amount);
      require(status, '_Amount recalculation failed.');
    }
    //Calling internal function to create proposal
    initialInsertOper(
      _proposalId,
      msg.sender,
      _amount,
      _totalAmount,
      _interestRate,
      _installmentMonths,
      _isCollateral,
      _isDirect,
      _isDirectAddress,
      false
    );
    emit LogUpdateProposal(_proposalId);
    return true;
  }

  /**
  @dev To recalculate amount for proposal update
  @param _createdUser Lender address
  @param _proposalId Proposal ID
  @param _amount Lending amount
  @return Bool
  */
  function isUpdateAmountRecalc(
    address _createdUser,
    uint256 _proposalId,
    uint256 _amount
  ) internal returns (bool) {
    //Collect amount or return amount
    bool status = true;
    if (proposalStructs[_proposalId].amount > _amount) {
      uint256 differenceAmount = proposalStructs[_proposalId].amount - _amount;
      {
        status = Vaults(contractRegistry.getIVaultContractAddress()).refundToken(
          address(contractRegistry.getIVaultContractAddress()),
          _createdUser,
          differenceAmount,
          _proposalId
        );
        require(status, '_ token refund transfer failed.');
      }
    } else if (_amount > proposalStructs[_proposalId].amount) {
      uint256 differenceAmount = _amount - proposalStructs[_proposalId].amount;
      {
        status = Vaults(contractRegistry.getIVaultContractAddress()).depositToken(
          _createdUser,
          address(contractRegistry.getIEscrowContractAddress()),
          differenceAmount,
          _proposalId
        );
        require(status, '_ token deposit transfer failed.');
      }
    }
    return status;
  }

  /**
  @dev To delete proposals
  @param _proposalId Proposal ID
  @return _success
  */
  function deleteProposal(uint256 _proposalId) external nonReentrant returns (bool _success) {
    require(isUser(msg.sender), '_user is not registered');
    require(isProposal(_proposalId), '_proposal is invalid');
    address userId = proposalStructs[_proposalId].userId;
    require(userId == msg.sender, '_Proposal owner is invalid');
    //Proposal State Verification
    require(
      proposalStructs[_proposalId].proposalState == ProposalState.ACTIVE,
      '_proposal is assigned to borrower'
    );
    require(
      proposalStructs[_proposalId].borrowDetails.borrowState == BorrowState.INACTIVE,
      '_proposal is assigned to borrower'
    );
    {
      //transfer token back to user before deletion
      bool status = Vaults(contractRegistry.getIVaultContractAddress()).refundToken(
        address(contractRegistry.getIVaultContractAddress()),
        msg.sender,
        proposalStructs[_proposalId].amount,
        _proposalId
      );
      require(status, '_token refund transfer failed.');
    }
    if (proposalStructs[_proposalId].isDirectInfo.isDirect) {
      updatePendingRequests(_proposalId);
    }
    //delete proposal from proposal and user structs
    deleteProposalStruct(_proposalId);
    emit LogProposalDeleted(_proposalId);
    return true;
  }

  /**
  @dev Internal function to delete proposals
  @param _proposalId Proposal ID
  @return success
  */
  function deleteProposalStruct(uint256 _proposalId) internal returns (bool success) {
    address userId = proposalStructs[_proposalId].userId;
    // hard delete from the Proposal table
    uint256 rowToDelete = proposalStructs[_proposalId].proposalListPointer;
    uint256 keyToMove = proposalList[proposalList.length - 1];
    proposalList[rowToDelete] = keyToMove;
    proposalStructs[keyToMove].proposalListPointer = rowToDelete;
    proposalStructs[_proposalId].proposalState = ProposalState.DELETED;
    proposalList.pop();
    //delete the proposal from the userstructs also
    rowToDelete = userStructs[userId].proposalIdPointers[_proposalId];
    keyToMove = userStructs[userId].proposalIds[userStructs[userId].proposalIds.length - 1];
    userStructs[userId].proposalIds[rowToDelete] = keyToMove;
    userStructs[userId].proposalIdPointers[keyToMove] = rowToDelete;
    userStructs[userId].proposalIds.pop();
    return true;
  }

  /**
  @dev Function to get the proposal details based on  Id.
  @param _proposalId Proposal ID
  @return proposal Proposal details
  */
  function getProposalDetails(uint256 _proposalId)
    public
    view
    returns (ProposalStruct memory proposal)
  {
    return (proposalStructs[_proposalId]);
  }

  /**
  @dev Function to close the loan
  @param _proposalId Proposal ID
  @return status
  */
  function updateCloseStatus(uint256 _proposalId) public onlyOwner returns (bool status) {
    proposalStructs[_proposalId].proposalState = ProposalState.CLOSED;
    proposalStructs[_proposalId].borrowDetails.borrowState = BorrowState.CLOSED;
    proposalStructs[_proposalId].earnings.completedInstallments = proposalStructs[_proposalId]
      .instalmentMonths;
    return true;
  }

  /**
  @dev Function to delete the pending requests
  @param _proposalId Proposal ID
  @return _success boolean status
  */
  function updatePendingRequests(uint256 _proposalId) internal returns (bool _success) {
    if (proposalStructs[_proposalId].isDirectInfo.isDirect) {
      {
        address directAddr = proposalStructs[_proposalId].isDirectInfo.isDirectAddress;
        uint256 length = userStructs[directAddr].pendingRequests.length;
        for (uint256 i = 0; i < length; i++) {
          if (userStructs[directAddr].pendingRequests[i] == _proposalId) {
            userStructs[directAddr].pendingRequests[i] = userStructs[directAddr].pendingRequests[
              length - 1
            ];
          }
        }
        userStructs[directAddr].pendingRequests.pop();
      }
    }
    return true;
  }
}
