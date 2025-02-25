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
})
