import {ResolverCancellationConfig} from './resolver-cancellation-config'

describe('ResolverCancellationConfig', () => {
    it('should reject a half-zero cancellation config', () => {
        expect(() => new ResolverCancellationConfig(1n, 0)).toThrow(
            'inconsistent cancellation config'
        )
        expect(() => new ResolverCancellationConfig(0n, 1)).toThrow(
            'inconsistent cancellation config'
        )
    })

    it('should treat disable as the zero config', () => {
        const disabled =
            ResolverCancellationConfig.disableResolverCancellation()

        expect(disabled).toBe(ResolverCancellationConfig.ZERO)
        expect(disabled.isZero()).toBe(true)
        expect(disabled.maxCancellationPremium).toBe(0n)
        expect(disabled.cancellationAuctionDuration).toBe(0)
    })

    it('should accept a non-zero premium and duration', () => {
        const config = new ResolverCancellationConfig(10n, 30)

        expect(config.isZero()).toBe(false)
        expect(config.maxCancellationPremium).toBe(10n)
        expect(config.cancellationAuctionDuration).toBe(30)
    })
})
