import {AmountCalculator} from './amount-calculator'
import {AuctionCalculator} from './auction-calculator'
import {FeeCalculator} from './fee-calculator/fee-calculator'
import {now} from '../utils'
import {AuctionDetails} from '../fusion-order'
import {Bps} from '../domains'

describe('AmountCalculator', () => {
    it('should return total fee', () => {
        const protocolFee = Bps.fromPercent(1)
        const integratorFee = Bps.fromPercent(2)
        const surplusShare = Bps.fromPercent(50)
        const calculator = new AmountCalculator(
            AuctionCalculator.fromAuctionData(
                AuctionDetails.noAuction(now(), 120)
            ),
            new FeeCalculator(protocolFee, integratorFee, surplusShare)
        )

        const totalFee = calculator.getTotalFee(1000n, 500n, now())

        expect(totalFee).toEqual(265n) // ((1000 - 10 - 20) - 500)*.5 + 10 + 20
    })

    it('should return integrator fee', () => {
        const protocolFee = Bps.fromPercent(1)
        const integratorFee = Bps.fromPercent(2)
        const surplusShare = Bps.fromPercent(50)
        const calculator = new AmountCalculator(
            AuctionCalculator.fromAuctionData(
                AuctionDetails.noAuction(now(), 120)
            ),
            new FeeCalculator(protocolFee, integratorFee, surplusShare)
        )

        const totalFee = calculator.getIntegratorFee(1000n, now())

        expect(totalFee).toEqual(20n) // 1000 * 2%
    })

    it('should return protocol fee with no surplus', () => {
        const protocolFee = Bps.fromPercent(1)
        const integratorFee = Bps.fromPercent(2)
        const surplusShare = Bps.fromPercent(50)
        const calculator = new AmountCalculator(
            AuctionCalculator.fromAuctionData(
                AuctionDetails.noAuction(now(), 120)
            ),
            new FeeCalculator(protocolFee, integratorFee, surplusShare)
        )

        const totalFee = calculator.getProtocolFee(1000n, 1000n, now())

        expect(totalFee).toEqual(10n) // 1000 * 1% (no surplus)
    })

    it('should return protocol fee with surplus', () => {
        const protocolFee = Bps.fromPercent(1)
        const integratorFee = Bps.fromPercent(2)
        const surplusShare = Bps.fromPercent(50)
        const calculator = new AmountCalculator(
            AuctionCalculator.fromAuctionData(
                AuctionDetails.noAuction(now(), 120)
            ),
            new FeeCalculator(protocolFee, integratorFee, surplusShare)
        )

        const totalFee = calculator.getProtocolFee(1000n, 500n, now())

        expect(totalFee).toEqual(245n) // ((1000 - 10 - 20) - 500)*.5 + 10
    })
})
