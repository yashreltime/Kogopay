// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@chainlink/contracts/src/v0.8/ChainlinkClient.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract MarketRateOracleV3 is ChainlinkClient, Ownable {
  bytes32 public constant WBTC = keccak256('WBTC');
  bytes32 public constant WETH = keccak256('WETH');
  bytes32 public constant WUSDT = keccak256('WUSDT');
  bytes32 public constant WUSDC = keccak256('WUSDC');
  bytes32 public constant WBNB = keccak256('WBNB');
  bytes32 public constant RTC = keccak256('RTC');
  bytes32 public constant RTO = keccak256('RTO');
  bytes32 public constant USD = keccak256('USD');
  bytes32 public constant GBP = keccak256('GBP');

  mapping(bytes32 => uint256) marketRate;
  mapping(address => bool) public nodes;
  address public consumer;

  modifier isConsumer() {
    require(msg.sender == consumer);
    _;
  }

  constructor(address _link) {
    setChainlinkToken(_link);
  }

  function fulfillMarketRate(bytes memory data) public {
    require(nodes[msg.sender], 'Unknown node.');
    (
      uint256 btc,
      uint256 eth,
      uint256 bnb,
      uint256 usdt,
      uint256 usdc,
      uint256 rtc,
      uint256 rto,
      uint256 gbp
    ) = abi.decode(data, (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256));
    marketRate[WBTC] = btc;
    marketRate[WETH] = eth;
    marketRate[WBNB] = bnb;
    marketRate[WUSDT] = usdt;
    marketRate[WUSDC] = usdc;
    marketRate[RTO] = rto;
    marketRate[RTC] = rtc;
    marketRate[USD] = 1000000000000000000;
    marketRate[GBP] = gbp;
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