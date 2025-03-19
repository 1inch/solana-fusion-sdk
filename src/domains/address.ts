import bs58 from 'bs58'
import {hexToUint8Array} from '@1inch/byte-utils'
import {PublicKey} from '@solana/web3.js'

export type AddressLike = {
    toBuffer(): Buffer
}

export class Address implements AddressLike {
    public static ASSOCIATED_TOKE_PROGRAM_ID = new Address(
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
    )

    public static TOKEN_PROGRAM_ID = new Address(
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    )

    public static TOKEN_2022_PROGRAM_ID = new Address(
        'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
    )

    public static SYSTEM_PROGRAM_ID = new Address(
        '11111111111111111111111111111111'
    )

    public static readonly WRAPPED_NATIVE = new Address(
        'So11111111111111111111111111111111111111112'
    )

    private readonly buf: Uint8Array

    constructor(value: string) {
        try {
            this.buf = bs58.decode(value)

            if (this.buf.length !== 32) {
                throw ''
            }
        } catch {
            throw new Error(`${value} is not a valid address.`)
        }
    }

    static fromUnknown(val: unknown): Address {
        if (!val) {
            throw new Error('invalid address')
        }

        if (typeof val === 'string') {
            return new Address(val)
        }

        if (typeof val === 'bigint') {
            return Address.fromBigInt(val)
        }

        if (
            typeof val === 'object' &&
            'toBuffer' in val &&
            typeof val.toBuffer === 'function'
        ) {
            const buffer = val.toBuffer()

            if (buffer instanceof Buffer || buffer instanceof Uint8Array) {
                return Address.fromBuffer(buffer)
            }
        }

        throw new Error('invalid address')
    }

    static unique(): Address {
        return Address.fromPublicKey(PublicKey.unique())
    }

    static fromPublicKey(publicKey: AddressLike): Address {
        return Address.fromBuffer(publicKey.toBuffer())
    }

    static fromBuffer(buf: Buffer | Uint8Array): Address {
        return new Address(bs58.encode(buf))
    }

    static fromBigInt(val: bigint): Address {
        const buffer = hexToUint8Array(
            '0x' + val.toString(16).padStart(64, '0')
        )

        return Address.fromBuffer(buffer)
    }

    toString(): string {
        return bs58.encode(this.buf)
    }

    toJSON(): string {
        return this.toString()
    }

    public toBuffer(): Buffer {
        return Buffer.from(this.buf)
    }

    public equal(other: Address): boolean {
        return this.toBuffer().equals(other.toBuffer())
    }
}
