export type OrdersApiConfig = {
    url: string
    authKey: string
}

/**
 * @example
 * {
 *  "orderHash": "GxXW4Bhtn1xuFRgzAUNyMnYyBJgzvBALNPontUdmpENm",
 *  "txSignature": "41EYz9L7196ZYPY9V61u33Dhp6dpg7nY1pVexbxBs36xCQLo1fnxvFMBBpjXnkg3ETrz1jnjLPWYvzpu8xDkP39K",
 *  "maker": "6uJb1VeHBzupesBi6xM9Sh98JhhfmM1nvMTYHL8Pd26b",
 *  "order": {
 *    "id": 1,
 *    "srcAmount": "100000000000000000",
 *    "minDstAmount": "100000000000000000",
 *    "estimatedDstAmount": "100000000000000000",
 *    "expirationTime": 1634025600000,
 *    "receiver": "6uJb1VeHBzupesBi6xM9Sh98JhhfmM1nvMTYHL8Pd26b",
 *    "srcAssetIsNative": true,
 *    "dstAssetIsNative": false,
 *    "fee": {
 *      "protocolFee": 5,
 *      "integratorFee": 3,
 *      "surplusPercentage": 2,
 *      "protocolDstAta": "string",
 *      "integratorDstAta": "string",
 *      "maxCancellationPremium": "string"
 *    },
 *    "dutchAuctionData": {
 *      "startTime": 1715000000,
 *      "duration": 300,
 *      "initialRateBump": 1,
 *      "pointsAndTimeDeltas": [
 *        {
 *          "rateBump": 1,
 *          "timeDelta": 30
 *        }
 *      ],
 *      "srcMint": "So11111111111111111111111111111111111111112",
 *      "dstMint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
 *      "cancellationAuctionDuration": 1
 *    },
 *    "remainingMakerAmount": "100000"
 *  }
 */
export type OrderInfoDTO = {
    orderHash: string
    txSignature: string
    maker: string
    order: OrderDTO
    remainingMakerAmount: string
}

export type OrderCancellableByResolverInfoDTO = Omit<
    OrderInfoDTO,
    'remainingMakerAmount'
>

export type OrderDTO = {
    id: number
    srcAmount: string
    minDstAmount: string
    estimatedDstAmount: string
    expirationTime: number
    receiver: string
    srcAssetIsNative: boolean
    dstAssetIsNative: boolean
    fee: {
        protocolFee: number
        integratorFee: number
        surplusPercentage: number
        protocolDstAta: string
        integratorDstAta: string
        maxCancellationPremium: string
    }
    dutchAuctionData: {
        startTime: number
        duration: number
        initialRateBump: number
        pointsAndTimeDeltas: Array<{
            rateBump: number
            timeDelta: number
        }>
    }
    srcMint: string
    dstMint: string
    cancellationAuctionDuration: number
}

/**
 * @example
 * {
 *  "maker": "6uJb1VeHBzupesBi6xM9Sh98JhhfmM1nvMTYHL8Pd26b",
 *  "orderHash": "GxXW4Bhtn1xuFRgzAUNyMnYyBJgzvBALNPontUdmpENm",
 *  "status": 0,
 *  "order": {
 *    "id": 1,
 *    "srcAmount": "100000000000000000",
 *    "minDstAmount": "100000000000000000",
 *    "estimatedDstAmount": "100000000000000000",
 *    "expirationTime": 1634025600000,
 *    "receiver": "6uJb1VeHBzupesBi6xM9Sh98JhhfmM1nvMTYHL8Pd26b",
 *    "srcAssetIsNative": true,
 *    "dstAssetIsNative": false,
 *    "fee": {
 *      "protocolFee": 5,
 *      "integratorFee": 3,
 *      "surplusPercentage": 2,
 *      "protocolDstAta": "string",
 *      "integratorDstAta": "string",
 *      "maxCancellationPremium": "string"
 *    },
 *    "dutchAuctionData": {
 *      "startTime": 1715000000,
 *      "duration": 300,
 *      "initialRateBump": 1,
 *      "pointsAndTimeDeltas": [
 *        {
 *          "rateBump": 1,
 *          "timeDelta": 30
 *        }
 *      ]
 *    },
 *    "srcMint": "So11111111111111111111111111111111111111112",
 *    "dstMint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
 *    "cancellationAuctionDuration": 1
 *  },
 *  "approximateTakingAmount": "970000000",
 *  "cancelTx": "5zXYv1KwMkGgyZ8hA5QYpMjPsnvPiK7PXivJLBX9vhvB",
 *  "expirationTime": 1715000000,
 *  "fills": [
 *    {
 *      "txSignature": "41EYz9L7196ZYPY9V61u33Dhp6dpg7nY1pVexbxBs36xCQLo1fnxvFMBBpjXnkg3ETrz1jnjLPWYvzpu8xDkP39K",
 *      "filledMakerAmount": "100000000000000000",
 *      "filledAuctionTakerAmount": "100000000000000000"
 *    }
 *  ],
 *  "createdAt": 1715000000,
 *  "srcTokenPriceUsd": 100,
 *  "dstTokenPriceUsd": 200,
 *  "cancelable": false
 *}
 */
export type OrderStatusDTO = {
    maker: string
    orderHash: string
    status: OrderStatus
    order: OrderDTO
    approximateTakingAmount: string
    cancelTx?: string
    expirationTime: number
    fills: Array<{
        txSignature: string
        filledMakerAmount: string
        filledAuctionTakerAmount: string
    }>
    createdAt: number
    srcTokenPriceUsd: number
    dstTokenPriceUsd: number
    cancelable: boolean
}

export enum OrderStatus {
    inProgress = 0,
    filled = 200,
    cancelled = 301
}
