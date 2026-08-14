import assert from 'assert'
import {Preset} from './preset'
import {QuoteFee} from './quote-fee'
import {PresetType, QuoteDTO} from '../api'
import {AuctionDetails, FeeConfig, FusionOrder} from '../fusion-order'
import {CreateAtaIdempotentInstruction} from '../contracts/create-ata-idempotent.instruction'
import {Address, Bps} from '../domains'
import {getAta, id, now} from '../utils'

export class Quote {
    constructor(
        public readonly srcToken: Address,
        public readonly dstToken: Address,
        public readonly signer: Address,
        public readonly quoteId: string,
        public readonly srcAmount: bigint,
        public readonly dstAmount: bigint,
        public readonly presets: {
            fast: Preset
            medium: Preset
            slow: Preset
        },
        public readonly recommendedPreset: PresetType,
        public readonly priceImpactPercent: number,
        /**
         * Fees frozen on this quote; dstAmount and preset auction amounts are already net of them.
         * {@link toOrder} bakes them into the order automatically
         */
        public readonly fee: QuoteFee | null = null
    ) {}

    static fromJSON(
        srcToken: Address,
        dstToken: Address,
        signer: Address,
        json: QuoteDTO
    ): Quote {
        assert(
            json.quoteId,
            'quoteId is required. Use enableEstimate=true to generate it'
        )

        return new Quote(
            srcToken,
            dstToken,
            signer,
            json.quoteId,
            BigInt(json.srcAmount),
            BigInt(json.dstAmount),
            {
                fast: Preset.fromJSON(json.presets.fast),
                medium: Preset.fromJSON(json.presets.medium),
                slow: Preset.fromJSON(json.presets.slow)
            },
            json.recommendedPreset,
            json.priceImpactPercent,
            json.fee ? QuoteFee.fromJSON(json.fee) : null
        )
    }

    /**
     * Builds the order for this quote, embedding its fees when present.
     * For an SPL destination prepend {@link getFeeAtaCreateInstructions} to the create-order transaction
     */
    public toOrder(
        presetType = this.recommendedPreset,
        receiver = this.signer
    ): FusionOrder {
        const preset = this.presets[presetType]

        return FusionOrder.new(
            {
                srcMint: this.srcToken,
                dstMint: this.dstToken,
                id: id(),
                receiver,
                srcAmount: this.srcAmount,
                estimatedDstAmount: this.dstAmount,
                minDstAmount: preset.auctionEndAmount
            },
            new AuctionDetails({
                startTime: preset.startAuctionIn + now(),
                duration: preset.auctionDuration,
                initialRateBump: preset.initialRateBump,
                points: preset.points
            }),
            this.fee === null ? {} : {fees: this.buildFeeConfig(this.fee)}
        )
    }

    /**
     * Instructions creating the fee token accounts the order pays into, for an SPL destination.
     * Prepend them to the create-order transaction: creation is idempotent and `payer` funds only missing accounts.
     * A native-SOL destination and a fee-less quote need none
     */
    public getFeeAtaCreateInstructions(
        payer = this.signer
    ): CreateAtaIdempotentInstruction[] {
        const fee = this.fee

        if (fee === null || this.dstToken.isNative()) {
            return []
        }

        return this.feeReceiverWallets(fee).map(
            (owner) =>
                new CreateAtaIdempotentInstruction(
                    payer,
                    owner,
                    this.dstToken,
                    fee.dstTokenProgram
                )
        )
    }

    /**
     * Fee receiver wallets paid directly for a native-SOL destination.
     * Verify they exist on-chain before creating the order — lamport transfers to unfunded wallets fail at fill.
     * An SPL destination and a fee-less quote have none
     */
    public getNativeFeeReceiverWallets(): Address[] {
        if (this.fee === null || !this.dstToken.isNative()) {
            return []
        }

        return this.feeReceiverWallets(this.fee)
    }

    private feeReceiverWallets(fee: QuoteFee): Address[] {
        const owners: Address[] = []

        if (fee.receiver !== null) {
            owners.push(fee.receiver)
        }

        if (!fee.protocolFee.isZero()) {
            owners.push(fee.protocolReceiver)
        }

        return owners
    }

    private buildFeeConfig(fee: QuoteFee): FeeConfig {
        const protocolReceiver = fee.protocolFee.isZero()
            ? null
            : this.resolveFeeReceiver(fee.protocolReceiver, fee.dstTokenProgram)

        const integratorReceiver =
            fee.receiver === null
                ? null
                : this.resolveFeeReceiver(fee.receiver, fee.dstTokenProgram)

        return new FeeConfig(
            protocolReceiver,
            integratorReceiver,
            fee.protocolFee,
            fee.integratorFee,
            Bps.ZERO
        )
    }

    private resolveFeeReceiver(
        wallet: Address,
        dstTokenProgram: Address
    ): Address {
        if (this.dstToken.isNative()) {
            return wallet
        }

        return getAta(wallet, this.dstToken, dstTokenProgram)
    }
}
