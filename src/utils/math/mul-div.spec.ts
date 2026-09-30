import {mulDiv, Rounding} from './mul-div'

describe('mulDiv', () => {
    it('should floor by default', () => {
        expect(mulDiv(10n, 3n, 4n)).toBe(7n)
        expect(mulDiv(10n, 3n, 4n, Rounding.Floor)).toBe(7n)
    })

    it('should ceil when the product has a remainder', () => {
        expect(mulDiv(10n, 3n, 4n, Rounding.Ceil)).toBe(8n)
    })

    it('should not add one when the product divides evenly', () => {
        expect(mulDiv(10n, 2n, 4n, Rounding.Ceil)).toBe(5n)
    })
})
