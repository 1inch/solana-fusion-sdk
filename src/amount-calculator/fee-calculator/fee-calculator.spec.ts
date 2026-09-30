import {Bps, FeeCalculator} from '../../index'
import {FeeConfig} from '../../fusion-order'
import {Address} from '../../domains'

describe('FeeCalculator', () => {
    it('should be usable via the package root export', () => {
        const calculator = new FeeCalculator(
            Bps.fromPercent(1),
            Bps.fromPercent(2),
            Bps.fromPercent(50)
        )

        expect(calculator.getIntegratorFee(1000n)).toEqual(20n)
        expect(calculator.getUserReceiveAmount(1000n, 1000n)).toEqual(970n)
    })

    it('should copy rates from a fee config', () => {
        const config = new FeeConfig(
            Address.fromBigInt(11n),
            Address.fromBigInt(12n),
            Bps.fromPercent(1),
            Bps.fromPercent(2),
            Bps.fromPercent(50)
        )
        const calculator = FeeCalculator.fromFeeConfig(config)

        expect(calculator.protocolFee).toEqual(config.protocolFee)
        expect(calculator.integratorFee).toEqual(config.integratorFee)
        expect(calculator.surplusShare).toEqual(config.surplusShare)
        expect(calculator.getProtocolFee(1000n, 500n)).toEqual(245n)
    })
})
