export default Object.freeze({
  userDetails: [
    {
      type: 'array',
      key: 'proposalIds',
    },
    {
      type: 'array',
      key: 'borrowings',
    },
    {
      type: 'array',
      key: 'pendingRequests',
    },
  ],
  proposalDetails: [
    {
      type: 'value',
      key: 'proposalListPointer',
      needProcessing: false,
    },
    {
      type: 'value',
      key: 'owner',
    },
    {
      type: 'value',
      key: 'amount',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'interestRate',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'instalmentMonths',
      needProcessing: false,
    },
    {
      type: 'object',
      key: 'datesInfo',
    },
    {
      type: 'value',
      key: 'isCollateral',
    },
    {
      type: 'object',
      key: 'collateralInfo',
    },
    {
      type: 'object',
      key: 'directInfo',
    },
    {
      type: 'enum',
      key: 'proposalState',
    },
    {
      type: 'object',
      key: 'borrowDetails',
    },
    {
      type: 'object',
      key: 'earningDetails',
    },
    {
      type: 'value',
      key: 'proposalId',
    },
  ],
  datesInfo: [
    {
      type: 'value',
      key: 'createdDate',
    },
    {
      type: 'value',
      key: 'updatedDate',
    },
  ],
  collateralInfo: [
    {
      type: 'value',
      key: 'collateralTypeAddress',
    },
    {
      type: 'value',
      key: 'collateralPerPrice',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'collateralTotalPrice',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'collateralTokenQuantity',
      needProcessing: true,
    },
    {
      type: 'enum',
      key: 'collateralState',
    },
  ],
  collateralState: [
    {
      type: 'value',
      key: 'INVALID',
    },
    {
      type: 'value',
      key: 'PENDING',
    },
    {
      type: 'value',
      key: 'RECEIVED',
    },
    {
      type: 'value',
      key: 'FAILED',
    },
  ],
  directInfo: [
    {
      type: 'value',
      key: 'isDirect',
    },
    {
      type: 'value',
      key: 'isDirectAddress',
    },
  ],
  proposalState: [
    {
      type: 'value',
      key: 'INACTIVE',
    },
    {
      type: 'value',
      key: 'ACTIVE',
    },
    {
      type: 'value',
      key: 'CLOSED',
    },
  ],
  borrowDetails: [
    {
      type: 'value',
      key: 'borrowerAddress',
    },
    {
      type: 'enum',
      key: 'borrowState',
    },
    {
      type: 'value',
      key: 'receivedAmountStatus',
    },
    {
      type: 'value',
      key: 'borrowerStatus',
    },
  ],
  borrowState: [
    {
      type: 'value',
      key: 'INACTIVE',
    },
    {
      type: 'value',
      key: 'ACTIVE',
    },
    {
      type: 'value',
      key: 'CLOSED',
    },
  ],
  earningDetails: [
    {
      type: 'value',
      key: 'intrest',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'totalAmount',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'totalAdminShare',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'monthlyAdminShare',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'totalUserShare',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'monthlyUserShare',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'monthlyTotalShare',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'completedInstallments',
    },
  ],
  borrowRequest: [
    {
      type: 'value',
      key: 'requestedUser',
    },
    {
      type: 'value',
      key: 'requestedDate',
    },
    {
      type: 'enum',
      key: 'borrowRequestState',
    },
  ],
  borrowRequestState: [
    {
      type: 'value',
      key: 'AWAITING',
    },
    {
      type: 'value',
      key: 'REJECTED',
    },
    {
      type: 'value',
      key: 'ACCEPTED',
    },
    {
      type: 'value',
      key: 'DELETED',
    },
  ],
  calculateCollateral: [
    {
      type: 'value',
      key: 'collateralPercent',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'percentageChange',
    },
    {
      type: 'value',
      key: 'interestAmountPercentage',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'totalPercentage',
    },
    {
      type: 'value',
      key: 'totalCollateralAmount',
      needProcessing: true,
    },
  ],
  monthlyInstalment: [
    {
      type: 'value',
      key: 'monthlyAdminShare',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'monthlyUserShare',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'monthlyTotal',
      needProcessing: true,
    },
  ],
  pendingTokens: [
    {
      type: 'value',
      key: 'pendingTokenAmount',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'adminShare',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'userShare',
      needProcessing: true,
    },
  ],
  marketContract: [
    {
      type: 'value',
      key: 'adminShare',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'collateralPercent',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'collateralInterestMultipleFactor',
    },
    {
      type: 'value',
      key: 'delayedInstalmentsCount',
    },
  ],
  swapSummary: [
    {
      type: 'value',
      key: 'fromAmount',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'toAmount',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'swapFee',
      needProcessing: true,
    },
  ],
  swapDetails: [
    {
      type: 'value',
      key: 'id',
      needProcessing: false,
    },
    {
      type: 'value',
      key: 'from',
      needProcessing: false,
    },
    {
      type: 'value',
      key: 'tokenFrom',
      needProcessing: false,
    },
    {
      type: 'value',
      key: 'tokenTo',
      needProcessing: false,
    },
    {
      type: 'value',
      key: 'fromAmount',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'toAmount',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'expirationTimestamp',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'fromTokenUnitPrice',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'toTokenUnitPrice',
      needProcessing: true,
    },
    {
      type: 'value',
      key: 'adminFee',
      needProcessing: true,
    },
    {
      type: 'enum',
      key: 'swapClaim',
    },
  ],
  swapClaim: [
    {
      type: 'value',
      key: 'INVALID',
    },
    {
      type: 'value',
      key: 'OPEN',
    },
    {
      type: 'value',
      key: 'CLOSED',
    },
    {
      type: 'value',
      key: 'EXPIRED',
    },
    {
      type: 'value',
      key: 'FAILED',
    },
  ],
});
