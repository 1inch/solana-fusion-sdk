import {PresetDTO} from '../api'

export class Preset {
    constructor(
        public readonly startAuctionIn: number,
        public readonly auctionDuration: number,
        public readonly initialRateBump: number,
        public readonly auctionStartAmount: bigint,
        public readonly auctionEndAmount: bigint,
        public readonly costInDstToken: bigint,
        public readonly points: Array<{
            delay: number
            coefficient: number
        }>
    ) {}

    static fromJSON(json: PresetDTO): Preset {
        return new Preset(
            json.startAuctionIn,
            json.auctionDuration,
            json.initialRateBump,
            BigInt(json.auctionStartAmount),
            BigInt(json.auctionEndAmount),
            BigInt(json.costInDstToken),
            json.points
        )
    }
}
