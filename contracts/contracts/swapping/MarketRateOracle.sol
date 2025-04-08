// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@chainlink/contracts/src/v0.8/ChainlinkClient.sol';
// import '@chainlink/contracts/src/v0.8/ConfirmedOwner.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces//IMedianOracle.sol';

contract MarketRateOracle is ChainlinkClient, Ownable {
  bytes32 public constant WBTC = keccak256('WBTC');
  bytes32 public constant WETH = keccak256('WETH');
  bytes32 public constant WUSDT = keccak256('WUSDT');
  bytes32 public constant WUSDC = keccak256('WUSDC');
  bytes32 public constant WBNB = keccak256('WBNB');
  bytes32 public constant RTC = keccak256('RTC');
  bytes32 public constant RTO = keccak256('RTO');

  mapping(bytes32 => uint256) marketRate;
  mapping(address => bool) public nodes;
  address public consumer;

  MedianOracle medianOracle;

  modifier isConsumer() {
    require(msg.sender == consumer);
    _;
  }

  constructor(address _link) public {
    setChainlinkToken(_link);
  }

  function fulfillMarketRate(bytes memory _token, bytes32 _rate) public {
    require(nodes[msg.sender], 'Unknown node.');
    bytes32 tokenCode = keccak256(_token);
    marketRate[tokenCode] = uint256(_rate);
  }

  function getMarketRates(bytes32 _tokenCode) external view isConsumer returns (uint256) {
    return marketRate[_tokenCode];
  }

  function setConsumerAddress(address _consumer) public onlyOwner {
    consumer = _consumer;
  }

  function getConsumerAddress() public view returns (address) {
    return consumer;
  }

  function setNodePermission(address _node, bool _permission) public onlyOwner {
    nodes[_node] = _permission;
  }

  function getChainlinkToken() public view returns (address) {
    return chainlinkTokenAddress();
  }

  function withdrawLink() public onlyOwner {
    LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
    require(link.transfer(msg.sender, link.balanceOf(address(this))), 'Unable to transfer');
  }
}
