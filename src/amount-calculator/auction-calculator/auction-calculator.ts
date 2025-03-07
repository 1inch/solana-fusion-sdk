import {UINT_16_MAX} from '@1inch/byte-utils'
import {AuctionDetails, AuctionPoint} from '../../fusion-order'
import {mulDiv, Rounding} from '../../utils/math/mul-div'
import {assertUInteger} from '../../utils'

export class AuctionCalculator {
    public static RATE_BUMP_DENOMINATOR = 100_000n // 100%

    constructor(
        private readonly startTime: number,
        private readonly duration: number,
        private readonly initialRateBump: number,
        private readonly points: AuctionPoint[]
    ) {
        assertUInteger(initialRateBump, UINT_16_MAX)
        assertUInteger(startTime)
        assertUInteger(duration)

        points.forEach((point) => {
            assertUInteger(point.delay, UINT_16_MAX)
            assertUInteger(point.coefficient, UINT_16_MAX)
        })
    }

    get finishTime(): number {
        return this.startTime + this.duration
    }

    static fromAuctionData(details: AuctionDetails): AuctionCalculator {
        return new AuctionCalculator(
            details.startTime,
            details.duration,
            details.initialRateBump,
            details.points
        )
    }

    static calcInitialRateBump(startAmount: bigint, endAmount: bigint): number {
        const bump =
            (AuctionCalculator.RATE_BUMP_DENOMINATOR * startAmount) /
                endAmount -
            AuctionCalculator.RATE_BUMP_DENOMINATOR

        return Number(bump)
    }

    static calcAuctionTakingAmount(takingAmount: bigint, rate: number): bigint {
        return mulDiv(
            takingAmount,
            BigInt(rate) + AuctionCalculator.RATE_BUMP_DENOMINATOR,
            AuctionCalculator.RATE_BUMP_DENOMINATOR,
            Rounding.Ceil
        )
    }

    public calcAuctionTakingAmount(
        takingAmount: bigint,
        blockTime: number
    ): bigint {
        return AuctionCalculator.calcAuctionTakingAmount(
            takingAmount,
            this.calcRateBump(blockTime)
        )
    }

    /**
     * @param blockTime timestamp in seconds
     */
    public calcRateBump(blockTime: number): number {
        const auctionFinishTime = this.finishTime

        if (blockTime <= this.startTime) {
            return this.initialRateBump
        } else if (blockTime >= auctionFinishTime) {
            return 0
        }

        let currentRateBump = BigInt(this.initialRateBump)
        let currentPointTime = BigInt(this.startTime)
        const blockTimeBN = BigInt(blockTime)

        for (const {coefficient: nextRateBump, delay} of this.points) {
            const nextPointTime = BigInt(delay) + currentPointTime

            if (blockTimeBN <= nextPointTime) {
                return Number(
                    ((blockTimeBN - currentPointTime) * BigInt(nextRateBump) +
                        (nextPointTime - blockTimeBN) * currentRateBump) /
                        (nextPointTime - currentPointTime)
                )
            }

            currentPointTime = nextPointTime
            currentRateBump = BigInt(nextRateBump)
        }

        return Number(
            ((BigInt(auctionFinishTime) - blockTimeBN) * currentRateBump) /
                (BigInt(auctionFinishTime) - currentPointTime)
        )
    }
}
