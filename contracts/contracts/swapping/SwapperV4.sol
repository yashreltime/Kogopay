// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import './MarketRateOracle.sol';
import '../lending/interfaces/IERC20.sol';

contract SwapperV4 is OwnableUpgradeable, ERC20Upgradeable {
  using SafeMathUpgradeable for uint256;

  MarketRateOracle marketRate;
  uint256 swapFeePct; //10%

  bytes32 public constant WBTC = keccak256('WBTC');
  bytes32 public constant WETH = keccak256('WETH');
  bytes32 public constant WUSDT = keccak256('WUSDT');
  bytes32 public constant WUSDC = keccak256('WUSDC');
  bytes32 public constant WBNB = keccak256('WBNB');
  bytes32 public constant RTC = keccak256('RTC');
  bytes32 public constant RTO = keccak256('RTO');
  bytes32 public constant USD = keccak256('USD');
  bytes32 public constant GBP = keccak256('GBP');

  mapping(bytes32 => uint256) priceList;
  mapping(bytes32 => address) contractAddress;
  mapping(bytes32 => address) adminAddress;

  struct SwapData {
    uint256 id;
    address from;
    address tokenFrom;
    address tokenTo;
    uint256 fromAmount;
    uint256 toAmount;
    uint256 expirationTimestamp;
    uint256 fromTokenUnitPrice;
    uint256 toTokenUnitPrice;
    uint256 adminFee;
    SwapState claim;
  }

  mapping(uint256 => SwapData) public swapRequests;

  enum SwapState {
    INVALID,
    OPEN,
    CLOSED,
    EXPIRED,
    FAILED
  }

  event SwapRequest(
    address indexed _from,
    uint256 _swapId,
    address _fromToken,
    address _toToken,
    uint256 _fromAmount,
    uint256 _toAmount
  );

  function initialize(MarketRateOracle _marketRate) public initializer {
    __Ownable_init();
    marketRate = _marketRate;
    swapFeePct = 0;
  }

  //To initiate the swap request
  function requestSwap(
    uint256 _swapId,
    address _from,
    bytes32 _fromTokenType,
    bytes32 _toTokenType,
    uint256 _fromAmount,
    uint256 _toAmount,
    uint256 _expirationTimestamp
  ) public payable {
    require(_from == _msgSender(), 'Unknown sender');
    //Checking request expiration, to avoid price volatility affect the SWAP amount.
    require(_expirationTimestamp >= block.timestamp, 'Request expired, Please request again!');
    //Checking for existing SWAP request.
    require(swapRequests[_swapId].claim == SwapState.INVALID, 'Duplicate swap id!');
    //Verifying SWAP amounts.
    (uint256 _fAmount, uint256 _tAmount, uint256 _fee) = this.tokenCalculation(
      _fromTokenType,
      _toTokenType,
      _fromAmount,
      _toAmount
    );
    require(
      _fromAmount.sub(_fAmount) <= 10000000000 && _toAmount.sub(_tAmount) <= 10000000000,
      'Token prices varied, Please request again!'
    );

    if (_fromTokenType == RTC || _toTokenType == RTC) {
      _swapWithNativeToken(
        _swapId,
        _from,
        _fromTokenType,
        _toTokenType,
        _fAmount,
        _tAmount,
        _expirationTimestamp,
        _fee
      );
    } else {
      IERC20 wrappedFromAddress = IERC20(contractAddress[_fromTokenType]);
      IERC20 wrappedToAddress = IERC20(contractAddress[_toTokenType]);
      wrappedFromAddress.transferFrom(_msgSender(), adminAddress[_fromTokenType], _fAmount);
      SwapData memory swapData = SwapData({
        id: _swapId,
        from: _from,
        tokenFrom: address(wrappedFromAddress),
        tokenTo: address(wrappedToAddress),
        fromAmount: _fAmount,
        toAmount: _tAmount,
        expirationTimestamp: _expirationTimestamp,
        fromTokenUnitPrice: this.fetchTokenPrice(_fromTokenType),
        toTokenUnitPrice: this.fetchTokenPrice(_toTokenType),
        adminFee: _fee,
        claim: SwapState.OPEN
      });
      swapRequests[_swapId] = swapData;
      emit SwapRequest(
        _from,
        _swapId,
        contractAddress[_fromTokenType],
        contractAddress[_toTokenType],
        _fAmount,
        _tAmount
      );
    }
  }

  function _swapWithNativeToken(
    uint256 _swapId,
    address _from,
    bytes32 _fromTokenType,
    bytes32 _toTokenType,
    uint256 _fAmount,
    uint256 _tAmount,
    uint256 _expirationTimestamp,
    uint256 _fee
  ) internal {
    address fromAddress;
    address toAddress;
    if (_fromTokenType == RTC) {
      toAddress = contractAddress[_toTokenType];
      (bool status, ) = payable(adminAddress[_fromTokenType]).call{ value: _fAmount }('');
    } else if (_toTokenType == RTC) {
      fromAddress = contractAddress[_fromTokenType];
      IERC20(fromAddress).transferFrom(_msgSender(), adminAddress[_fromTokenType], _fAmount);
    }
    SwapData memory swapData = SwapData({
      id: _swapId,
      from: _from,
      tokenFrom: fromAddress,
      tokenTo: toAddress,
      fromAmount: _fAmount,
      toAmount: _tAmount,
      expirationTimestamp: _expirationTimestamp,
      fromTokenUnitPrice: this.fetchTokenPrice(_fromTokenType),
      toTokenUnitPrice: this.fetchTokenPrice(_toTokenType),
      adminFee: _fee,
      claim: SwapState.OPEN
    });
    swapRequests[_swapId] = swapData;
    emit SwapRequest(_from, _swapId, fromAddress, toAddress, _fAmount, _tAmount);
  }

  //To update the final status of swap
  function updateSwapStatus(uint256 _swapId, SwapState _status) public onlyOwner {
    swapRequests[_swapId].claim = _status;
  }

  //To fetch token per unit price
  function fetchTokenPrice(bytes32 TOKEN_TYPE) external view returns (uint256) {
    uint256 price = marketRate.getMarketRates(TOKEN_TYPE);
    return price;
  }

  //To estmate the tokenAmount
  function tokenCalculation(
    bytes32 _fromTokenType,
    bytes32 _toTokenType,
    uint256 _fromAmount,
    uint256 _toAmount
  ) external view returns (uint256 _fAmount, uint256 _tAmount, uint256 _fee) {
    uint256 _unitFromPrice = this.fetchTokenPrice(_fromTokenType);
    uint256 _unitToPrice = this.fetchTokenPrice(_toTokenType);
    require(_unitFromPrice > 0 && _unitToPrice > 0, 'Unable to get price details!');
    uint256 adminFee;
    uint256 fAmount;
    uint256 tAmount;
    if (_fromAmount > 0) {
      fAmount = _fromAmount;
      tAmount = _unitFromPrice.mul(_fromAmount).div(_unitToPrice);
    } else {
      tAmount = _toAmount;
      fAmount = _unitToPrice.mul(_toAmount).div(_unitFromPrice);
    }
    adminFee = tAmount.mul(swapFeePct).div(100 * 10 ** 18);
    require(tAmount.sub(adminFee) > 0, 'Please swap higher amount');
    tAmount = tAmount.sub(adminFee);
    return (fAmount, tAmount, adminFee);
  }

  //To set Market rate oracle address
  function updateMarketRateOracleAddress(
    address _marketRateAddress
  ) external onlyOwner returns (bool) {
    marketRate = MarketRateOracle(_marketRateAddress);
    return true;
  }

  //To get Market rate oracle address
  function getMarketRateOracleAddress() external view returns (address) {
    return address(marketRate);
  }

  //To set token contract address
  function setTokenContractAddress(
    bytes32 TOKEN_TYPE,
    address tokenAddress
  ) external onlyOwner returns (bool) {
    contractAddress[TOKEN_TYPE] = tokenAddress;
    return true;
  }

  //To fetch the token contract address
  function getTokenContractAddress(bytes32 TOKEN_TYPE) external view returns (address) {
    return contractAddress[TOKEN_TYPE];
  }

  //To set token admin address
  function setTokenAdminAddress(
    bytes32 TOKEN_TYPE,
    address _adminAddress
  ) external onlyOwner returns (bool) {
    adminAddress[TOKEN_TYPE] = _adminAddress;
    return true;
  }

  //To fetch the token contract address
  function getTokenAdminAddress(bytes32 TOKEN_TYPE) external view returns (address) {
    return adminAddress[TOKEN_TYPE];
  }

  //To update swap fee
  function updateSwapFeePercentage(uint256 _fee) external onlyOwner {
    require(_fee >= 0 && _fee <= 100000000000000000000, 'Please provide a valid amount!');
    swapFeePct = _fee;
  }

  //To fetch the swap fee
  function getSwapFeePercentage() external view returns (uint256) {
    return swapFeePct;
  }

  //To receive native coin

  receive() external payable {}
}