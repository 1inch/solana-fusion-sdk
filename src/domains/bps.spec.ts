import {Bps} from './bps'

describe('Bps', () => {
    it('should reject a value outside 0..10000', () => {
        expect(() => new Bps(-1n)).toThrow('invalid bps')
        expect(() => new Bps(10001n)).toThrow('invalid bps')
    })

    it('should convert percent and fraction forms', () => {
        expect(Bps.fromPercent(1).value).toBe(100n)
        expect(Bps.fromPercent(1, 2n).value).toBe(50n)
        expect(Bps.fromFraction(1, 2n).value).toBe(5000n)
        expect(Bps.fromPercent(2).toPercent()).toBe(2)
        expect(Bps.fromPercent(2).toFraction()).toBe(0.02)
        expect(Bps.fromPercent(2).toString()).toBe('200')
    })

    it('should compare equality and zero', () => {
        expect(Bps.ZERO.isZero()).toBe(true)
        expect(new Bps(1n).isZero()).toBe(false)
        expect(new Bps(100n).equal(Bps.fromPercent(1))).toBe(true)
        expect(new Bps(100n).equal(new Bps(200n))).toBe(false)
    })
})
