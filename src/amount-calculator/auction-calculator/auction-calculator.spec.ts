import {AuctionCalculator} from './auction-calculator'
import {AuctionDetails} from '../../fusion-order'

describe('Auction Calculator', () => {
    it('should be created successfully from suffix and salt', () => {
        const auctionStartTime = 1708448252

        const auctionDetails = new AuctionDetails({
            startTime: auctionStartTime,
            initialRateBump: 50000,
            duration: 120,
            points: []
        })

        const calculator = AuctionCalculator.fromAuctionData(auctionDetails)

        const blockTime = auctionStartTime + 60
        const rate = calculator.calcRateBump(blockTime)
        const auctionTakingAmount = calculator.calcAuctionTakingAmount(
            1420000000n,
            blockTime
        )

        expect(rate).toBe(25000)
        expect(auctionTakingAmount).toBe(1775000000n) // 1775000000 from rate
    })

    it('should keep the initial bump before the auction starts and drop to zero after it ends', () => {
        const startTime = 1_700_000_000
        const calculator = new AuctionCalculator(startTime, 120, 50000, [])

        expect(calculator.finishTime).toBe(startTime + 120)
        expect(calculator.calcRateBump(startTime)).toBe(50000)
        expect(calculator.calcRateBump(startTime - 1)).toBe(50000)
        expect(calculator.calcRateBump(startTime + 120)).toBe(0)
        expect(calculator.calcRateBump(startTime + 121)).toBe(0)
    })

    it('should interpolate the rate bump across auction points', () => {
        const startTime = 1_700_000_000
        const calculator = new AuctionCalculator(startTime, 120, 50000, [
            {delay: 60, coefficient: 25000}
        ])

        expect(calculator.calcRateBump(startTime + 30)).toBe(37500)
        expect(calculator.calcRateBump(startTime + 60)).toBe(25000)
        expect(calculator.calcRateBump(startTime + 90)).toBe(12500)
    })

    it('should derive the initial rate bump from start and end amounts', () => {
        expect(AuctionCalculator.calcInitialRateBump(150n, 100n)).toBe(50000)
        expect(
            AuctionCalculator.calcAuctionTakingAmount(1_000_000n, 50000)
        ).toBe(1_500_000n)
    })
})
