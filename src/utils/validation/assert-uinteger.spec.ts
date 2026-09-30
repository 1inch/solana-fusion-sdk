import {UINT_32_MAX} from '@1inch/byte-utils'
import {assertUInteger} from './assert-uinteger'

describe('assertUInteger', () => {
    it('should accept integers in range', () => {
        expect(() => assertUInteger(0)).not.toThrow()
        expect(() => assertUInteger(Number(UINT_32_MAX))).not.toThrow()
        expect(() => assertUInteger(0n, 10n)).not.toThrow()
    })

    it('should reject a non-integer number', () => {
        expect(() => assertUInteger(1.5)).toThrow('to be an integer')
    })

    it('should reject a negative value', () => {
        expect(() => assertUInteger(-1)).toThrow('to be >= 0')
        expect(() => assertUInteger(-1n)).toThrow('to be >= 0')
    })

    it('should reject a value above the max', () => {
        expect(() => assertUInteger(11n, 10n)).toThrow('to be <= 10')
        expect(() => assertUInteger(Number(UINT_32_MAX) + 1)).toThrow(
            'to be <='
        )
    })
})
