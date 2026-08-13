import {QuoteFeeDTO} from '../api'
import {Address, Bps} from '../domains'

export class QuoteFee {
    constructor(
        public readonly integratorFee: Bps,
        public readonly protocolFee: Bps,
        /**
         * null when the integrator fee is zero
         */
        public readonly receiver: Address | null,
        /**
         * Solana address receiving the protocol fee
         */
        public readonly protocolReceiver: Address,
        /**
         * Token program owning the destination mint; needed to derive the fee token accounts
         */
        public readonly dstTokenProgram: Address
    ) {}

    static fromJSON(json: QuoteFeeDTO): QuoteFee {
        return new QuoteFee(
            new Bps(BigInt(json.integratorFeeBps)),
            new Bps(BigInt(json.protocolFeeBps)),
            json.receiver === null ? null : new Address(json.receiver),
            new Address(json.protocolReceiver),
            new Address(json.dstTokenProgram)
        )
    }
}
