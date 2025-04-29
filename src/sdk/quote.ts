import assert from 'assert'
import {Preset} from './preset'
import {PresetType, QuoteDTO} from '../api'
import {AuctionDetails, FusionOrder} from '../fusion-order'
import {Address} from '../domains'
import {id, now} from '../utils'

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
        public readonly priceImpactPercent: number
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
            json.priceImpactPercent
        )
    }

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
            })
        )
    }
}
