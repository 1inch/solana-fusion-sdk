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

    it('should ceil the proportional taking amount', () => {
        expect(AmountCalculator.calcTakingAmount(50n, 100n, 200n)).toEqual(100n)
        expect(AmountCalculator.calcTakingAmount(1n, 3n, 10n)).toEqual(4n)
    })

    it('should treat a missing fee calculator as zero fees', () => {
        const calculator = new AmountCalculator(
            AuctionCalculator.fromAuctionData(
                AuctionDetails.noAuction(now(), 120)
            )
        )

        expect(calculator.getTotalFee(1000n, 500n, now())).toEqual(0n)
        expect(calculator.getUserReceiveAmount(1000n, 500n, now())).toEqual(
            1000n
        )
        expect(calculator.getIntegratorFee(1000n, now())).toEqual(0n)
        expect(calculator.getProtocolFee(1000n, 500n, now())).toEqual(0n)
        expect(calculator.getRequiredTakingAmount(1000n, now())).toEqual(1000n)
    })

    it('should return the user receive amount after auction and fees', () => {
        const calculator = new AmountCalculator(
            AuctionCalculator.fromAuctionData(
                AuctionDetails.noAuction(now(), 120)
            ),
            new FeeCalculator(
                Bps.fromPercent(1),
                Bps.fromPercent(2),
                Bps.fromPercent(50)
            )
        )

        expect(calculator.getUserReceiveAmount(1000n, 1000n, now())).toEqual(
            970n
        )
    })
})
