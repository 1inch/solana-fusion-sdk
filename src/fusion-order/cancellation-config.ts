import {UINT_64_MAX} from '@1inch/byte-utils'
import {Bps} from '../domains'
import {assertUInteger} from '../utils'

export class CancellationConfig {
    public static BASE_1E3 = 1000n

    static readonly ZERO = new CancellationConfig(0n, new Bps(0n), 0)

    static readonly ALMOST_ZERO = new CancellationConfig(1n, new Bps(0n), 0)

    constructor(
        public readonly minCancellationPremium: bigint,
        public readonly maxCancellationMultiplier: Bps,
        public readonly cancellationAuctionDuration: number
    ) {
        assertUInteger(cancellationAuctionDuration)
        assertUInteger(minCancellationPremium, UINT_64_MAX)
    }

    static disableResolverCancellation(): CancellationConfig {
        return CancellationConfig.ZERO
    }
}
