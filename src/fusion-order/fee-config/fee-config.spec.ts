import {FeeConfig} from './fee-config'
import {Address, Bps} from '../../domains'

const protocolAta = Address.fromBigInt(11n)
const integratorAta = Address.fromBigInt(12n)

describe('FeeConfig', () => {
    it('should reject integrator fee without integrator dst ATA', () => {
        expect(
            () => new FeeConfig(null, null, Bps.ZERO, new Bps(100n), Bps.ZERO)
        ).toThrow('integrator fee config mismatch')
    })

    it('should reject integrator dst ATA without integrator fee', () => {
        expect(
            () =>
                new FeeConfig(null, integratorAta, Bps.ZERO, Bps.ZERO, Bps.ZERO)
        ).toThrow('integrator fee config mismatch')
    })

    it('should reject protocol fee without protocol dst ATA', () => {
        expect(
            () => new FeeConfig(null, null, new Bps(100n), Bps.ZERO, Bps.ZERO)
        ).toThrow('protocol fee config mismatch')
    })

    it('should reject protocol dst ATA without protocol fee or surplus', () => {
        expect(
            () => new FeeConfig(protocolAta, null, Bps.ZERO, Bps.ZERO, Bps.ZERO)
        ).toThrow('protocol fee config mismatch')
    })

    it('should accept protocol dst ATA with surplus share only', () => {
        const config = new FeeConfig(
            protocolAta,
            null,
            Bps.ZERO,
            Bps.ZERO,
            new Bps(100n)
        )

        expect(config.protocolDstAta).toBe(protocolAta)
        expect(config.isZero()).toBe(false)
    })
})
