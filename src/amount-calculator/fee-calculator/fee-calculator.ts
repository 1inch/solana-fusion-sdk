import {Bps} from '../../domains'
import {FeeConfig} from '../../fusion-order'
import {mulDiv, Rounding} from '../../utils'

export class FeeCalculator {
    constructor(
        public readonly protocolFee: Bps,
        public readonly integratorFee: Bps,
        public readonly surplusShare: Bps
    ) {}

    static fromFeeConfig(feeConfig: FeeConfig): FeeCalculator {
        return new FeeCalculator(
            feeConfig.protocolFee,
            feeConfig.integratorFee,
            feeConfig.surplusShare
        )
    }

    /**
     * Fee in `dstToken` which integrator gets to integrator ata account
     *
     * @param auctionTakingAmount taking amount with auction bump applied
     */
    public getIntegratorFee(auctionTakingAmount: bigint): bigint {
        return mulDiv(
            auctionTakingAmount,
            BigInt(this.integratorFee.toFraction(FeeConfig.BASE_1E5)),
            FeeConfig.BASE_1E5,
            Rounding.Floor
        )
    }

    /**
     * Returns amount which will receive user
     *
     * @param auctionTakingAmount taking amount with auction bump applied
     * @param estimatedTakingAmount estimated taking amount
     */
    public getUserReceiveAmount(
        auctionTakingAmount: bigint,
        estimatedTakingAmount: bigint
    ): bigint {
        return this.getAmounts(auctionTakingAmount, estimatedTakingAmount)
            .userReceiveAmount
    }

    /**
     * Fee in `dstToken` which protocol gets to protocol ata account
     *
     * @param auctionTakingAmount taking amount with auction bump applied
     * @param estimatedTakingAmount estimated taking amount
     */
    public getProtocolFee(
        auctionTakingAmount: bigint,
        estimatedTakingAmount: bigint
    ): bigint {
        return this.getAmounts(auctionTakingAmount, estimatedTakingAmount)
            .protocolFeeAmount
    }

    private getAmounts(
        auctionTakingAmount: bigint,
        estimatedTakingAmount: bigint
    ): {protocolFeeAmount: bigint; userReceiveAmount: bigint} {
        let protocolFee = mulDiv(
            auctionTakingAmount,
            BigInt(this.protocolFee.toFraction(FeeConfig.BASE_1E5)),
            FeeConfig.BASE_1E5,
            Rounding.Floor
        )

        const integratorFee = this.getIntegratorFee(auctionTakingAmount)

        const userAmountWithoutFee =
            auctionTakingAmount - protocolFee - integratorFee

        if (userAmountWithoutFee > estimatedTakingAmount) {
            protocolFee += mulDiv(
                userAmountWithoutFee - estimatedTakingAmount,
                BigInt(this.surplusShare.toFraction(FeeConfig.BASE_1E2)),
                FeeConfig.BASE_1E2,
                Rounding.Floor
            )
        }

        return {
            protocolFeeAmount: protocolFee,
            userReceiveAmount: auctionTakingAmount - protocolFee - integratorFee
        }
    }
}
