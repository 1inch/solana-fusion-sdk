import {AuctionCalculator} from './auction-calculator'
import {FeeCalculator} from './fee-calculator/fee-calculator'

/**
 * Calculates fees/amount with accounting to auction
 *
 * @see FusionOrder
 */
export class AmountCalculator {
    constructor(
        private readonly auctionCalculator: AuctionCalculator,
        private readonly feeCalculator?: FeeCalculator
    ) {}

    /**
     * Calculates taker amount by linear proportion
     *
     * @return Ceiled taker amount
     */
    static calcTakingAmount(
        swapMakerAmount: bigint,
        orderMakerAmount: bigint,
        orderTakerAmount: bigint
    ): bigint {
        return (
            (swapMakerAmount * orderTakerAmount + orderMakerAmount - 1n) /
            orderMakerAmount
        )
    }

    /**
     * Returns how much resolver must pay to fill order
     *
     * @param takingAmount base taking amount without auction
     * @param time block time at which order will be filled
     */
    public getRequiredTakingAmount(takingAmount: bigint, time: number): bigint {
        return this.getAuctionBumpedAmount(takingAmount, time)
    }

    /**
     * Returns total fee = integrator + protocol
     *
     * @param takingAmount base taking amount without auction and fee
     * @param estimatedTakingAmount taking amount
     * @param time block time at which order will be filled
     */
    public getTotalFee(
        takingAmount: bigint,
        estimatedTakingAmount: bigint,
        time: number
    ): bigint {
        if (!this.feeCalculator) {
            return 0n
        }

        const auctionAmount = this.getAuctionBumpedAmount(takingAmount, time)
        const integratorFee = this.feeCalculator.getIntegratorFee(auctionAmount)
        const protocolFee = this.feeCalculator.getProtocolFee(
            auctionAmount,
            estimatedTakingAmount
        )

        return integratorFee + protocolFee
    }

    /**
     * Returns amount which will receive user
     *
     * @param takingAmount base taking amount without auction
     * @param estimatedTakingAmount taking amount
     * @param time block time at which order will be filled
     */
    public getUserReceiveAmount(
        takingAmount: bigint,
        estimatedTakingAmount: bigint,
        time: number
    ): bigint {
        const auctionAmount = this.getRequiredTakingAmount(takingAmount, time)

        return (
            this.feeCalculator?.getUserReceiveAmount(
                auctionAmount,
                estimatedTakingAmount
            ) ?? auctionAmount
        )
    }

    /**
     * Fee in `dstToken` which integrator gets to integrator ata account
     *
     * @param takingAmount base taking amount without auction
     * @param time block time at which order will be filled
     */
    public getIntegratorFee(takingAmount: bigint, time: number): bigint {
        return (
            this.feeCalculator?.getIntegratorFee(
                this.getAuctionBumpedAmount(takingAmount, time)
            ) ?? 0n
        )
    }

    /**
     * Fee in `dstToken` which protocol gets to protocol ata account
     *
     * @param takingAmount base taking amount without auction
     * @param estimatedTakingAmount taking amount
     * @param time block time at which order will be filled
     */
    public getProtocolFee(
        takingAmount: bigint,
        estimatedTakingAmount: bigint,
        time: number
    ): bigint {
        return (
            this.feeCalculator?.getProtocolFee(
                this.getAuctionBumpedAmount(takingAmount, time),
                estimatedTakingAmount
            ) ?? 0n
        )
    }

    private getAuctionBumpedAmount(takingAmount: bigint, time: number): bigint {
        const rateBump = this.auctionCalculator.calcRateBump(time)

        return AuctionCalculator.calcAuctionTakingAmount(takingAmount, rateBump)
    }
}
