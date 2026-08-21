import {Bps, FeeCalculator} from '../../index'

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
})
