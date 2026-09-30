import {PublicKey} from '@solana/web3.js'
import {Address} from './address'

describe('Address', () => {
    const wrappedNative = 'So11111111111111111111111111111111111111112'

    it('should reject a string that is not a 32-byte base58 key', () => {
        expect(() => new Address('not-an-address')).toThrow(
            'is not a valid address'
        )
        expect(() => new Address('1')).toThrow('is not a valid address')
    })

    it('should decode from string, bigint, buffer and public key', () => {
        const fromString = new Address(wrappedNative)
        const fromBigInt = Address.fromBigInt(1n)
        const fromBuffer = Address.fromBuffer(fromString.toBuffer())
        const fromPublicKey = Address.fromPublicKey(
            new PublicKey(wrappedNative)
        )

        expect(fromString.toString()).toBe(wrappedNative)
        expect(fromString.toJSON()).toBe(wrappedNative)
        expect(fromBuffer.equal(fromString)).toBe(true)
        expect(fromPublicKey.equal(fromString)).toBe(true)
        expect(fromBigInt.toBuffer()).toHaveLength(32)
        expect(Address.fromUnknown(wrappedNative).equal(fromString)).toBe(true)
        expect(Address.fromUnknown(1n).equal(fromBigInt)).toBe(true)
        expect(Address.fromUnknown(fromString).equal(fromString)).toBe(true)
    })

    it('should reject unknown values that are not addresses', () => {
        expect(() => Address.fromUnknown(null)).toThrow('invalid address')
        expect(() => Address.fromUnknown(undefined)).toThrow('invalid address')
        expect(() => Address.fromUnknown(true)).toThrow('invalid address')
        expect(() => Address.fromUnknown({})).toThrow('invalid address')
        expect(() => Address.fromUnknown({toBuffer: (): number => 1})).toThrow(
            'invalid address'
        )
    })

    it('should report native SOL and generate a unique address', () => {
        expect(Address.NATIVE.isNative()).toBe(true)
        expect(Address.WRAPPED_NATIVE.isNative()).toBe(false)
        expect(Address.unique().equal(Address.unique())).toBe(false)
    })
})
