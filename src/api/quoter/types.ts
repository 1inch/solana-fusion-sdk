/**
 * @example
 * {
 *  "startAuctionIn": 180,
 *  "auctionDuration": 24,
 *  "initialRateBump": 504,
 *  "auctionStartAmount": "146964760",
 *  "auctionEndAmount": "146227772",
 *  "costInDstToken": "312195",
 *  "points": [
 *    {
 *      "delay": 120,
 *      "coefficient": 164
 *    }
 *  ]
 *}
 */
export type PresetDTO = {
    startAuctionIn: number
    auctionDuration: number
    initialRateBump: number
    auctionStartAmount: string
    auctionEndAmount: string
    costInDstToken: string
    points: Array<{
        delay: number
        coefficient: number
    }>
}

export type PresetType = 'fast' | 'medium' | 'slow'

/**
 * @example
 * {
 *  "quoteId": "faf4062d-100a-4171-9ee3-685741404a5e",
 *  "srcAmount": "1000000000",
 *  "dstAmount": "146964760",
 *  "presets": {
 *    "fast": {
 *      "startAuctionIn": 180,
 *      "auctionDuration": 24,
 *      "initialRateBump": 504,
 *      "auctionStartAmount": "146964760",
 *      "auctionEndAmount": "146227772",
 *      "costInDstToken": "312195",
 *      "points": [
 *        {
 *          "delay": 120,
 *          "coefficient": 164
 *        }
 *      ]
 *    },
 *    "medium": {
 *      "startAuctionIn": 360,
 *      "auctionDuration": 24,
 *      "initialRateBump": 717,
 *      "auctionStartAmount": "147276226",
 *      "auctionEndAmount": "146227772",
 *      "costInDstToken": "312195",
 *      "points": [
 *        {
 *          "delay": 24,
 *          "coefficient": 504
 *        }
 *      ]
 *    },
 *    "slow": {
 *      "startAuctionIn": 600,
 *      "auctionDuration": 24,
 *      "initialRateBump": 717,
 *      "auctionStartAmount": "147276226",
 *      "auctionEndAmount": "146227772",
 *      "costInDstToken": "312195",
 *      "points": [
 *        {
 *          "delay": 24,
 *          "coefficient": 504
 *        }
 *      ]
 *    }
 *  },
 *  "recommendedPreset": "fast",
 *  "prices": {
 *    "usd": {
 *      "srcToken": "147.83554878",
 *      "dstToken": "0.9997309503539574"
 *    }
 *  },
 *  "volume": {
 *    "usd": {
 *      "srcToken": "147.84",
 *      "dstToken": "147.24"
 *    }
 *  },
 *  "priceImpactPercent": 0.405
 *}
 */
export type QuoteDTO = {
    /**
     * undefined if enableEstimate is false
     */
    quoteId?: string
    srcAmount: string
    dstAmount: string
    presets: {
        fast: PresetDTO
        medium: PresetDTO
        slow: PresetDTO
    }
    recommendedPreset: PresetType
    prices: {
        usd: {
            srcToken: string
            dstToken: string
        }
    }
    volume: {
        usd: {
            srcToken: string
            dstToken: string
        }
    }
    priceImpactPercent: number
}
