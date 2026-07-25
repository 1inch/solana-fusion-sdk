import {PublicKey} from '@solana/web3.js'
import {AddedAccount, ProgramTestContext} from 'solana-bankrun'
import {
    ACCOUNT_SIZE,
    AccountLayout,
    MINT_SIZE,
    MintLayout,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import {AddressLike} from '../src'

export const SYSTEM_PROGRAM_ID = new PublicKey(
    '11111111111111111111111111111111'
)

export function sol(n: number): number {
    return 1_000_000_000 * n
}

export function airdropAccount(pk: PublicKey, amount: number): AddedAccount {
    return {
        address: pk,
        info: {
            lamports: amount,
            data: Buffer.alloc(0),
            owner: SYSTEM_PROGRAM_ID,
            executable: false
        }
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export function nativeMintAccount(): AddedAccount {
    const data = Buffer.alloc(MINT_SIZE)
    MintLayout.encode(
        {
            mintAuthorityOption: 0,
            mintAuthority: PublicKey.default,
            supply: 0n,
            decimals: 9,
            isInitialized: true,
            freezeAuthorityOption: 0,
            freezeAuthority: PublicKey.default
        },
        data
    )

    return {
        address: NATIVE_MINT,
        info: {
            lamports: sol(1),
            data,
            owner: TOKEN_PROGRAM_ID,
            executable: false
        }
    }
}

export async function withLamportChanges(
    ctx: ProgramTestContext,
    fn: () => Promise<unknown>,
    accounts: PublicKey[]
): Promise<bigint[]> {
    const before = await Promise.all(
        accounts.map((a) => ctx.banksClient.getAccount(a))
    )
    await fn()

    const after = await Promise.all(
        accounts.map((a) => ctx.banksClient.getAccount(a))
    )

    return after.map(
        (af, i) => BigInt(af?.lamports ?? 0) - BigInt(before[i]?.lamports ?? 0)
    )
}

export async function withBalanceChanges(
    ctx: ProgramTestContext,
    fn: () => Promise<unknown>,
    accounts: AddressLike[]
): Promise<bigint[]> {
    const balancesBefore = await Promise.all(
        accounts.map((a) =>
            ctx.banksClient.getAccount(new PublicKey(a.toBuffer()))
        )
    )
    await fn()

    const balancesAfter = await Promise.all(
        accounts.map((a) =>
            ctx.banksClient.getAccount(new PublicKey(a.toBuffer()))
        )
    )

    return balancesAfter.map((af, i) => {
        const be = balancesBefore[i]

        const {amount: amountBefore} = be
            ? AccountLayout.decode(be.data.slice(0, ACCOUNT_SIZE))
            : {amount: 0n}
        const {amount: amountAfter} = af
            ? AccountLayout.decode(af.data.slice(0, ACCOUNT_SIZE))
            : {amount: 0n}

        return amountAfter - amountBefore
    })
}
