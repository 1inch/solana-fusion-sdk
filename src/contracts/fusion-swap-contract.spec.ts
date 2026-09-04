import {FusionSwapContract} from './fusion-swap-contract'
import {TransactionInstruction} from './transaction-instruction'
import {FusionOrder} from '../fusion-order/fusion-order'
import {AuctionDetails} from '../fusion-order/auction-details'
import {FeeConfig} from '../fusion-order/fee-config'
import {Address, Bps} from '../domains'
import {now} from '../utils'

const NONE_PLACEHOLDER = FusionSwapContract.ADDRESS
const USDC = new Address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
const NON_NATIVE_DST = Address.fromBigInt(5n)
const maker = Address.fromBigInt(1n)
const taker = Address.fromBigInt(2n)
const resolver = Address.fromBigInt(3n)
const receiver = Address.fromBigInt(4n)
const protocolAta = Address.fromBigInt(11n)
const integratorAta = Address.fromBigInt(12n)

const integratorOnlyFee = FeeConfig.onlyIntegrator(integratorAta, new Bps(100n))
const protocolOnlyFee = FeeConfig.onlyProtocol(
    protocolAta,
    new Bps(100n),
    Bps.ZERO
)
const bothFees = new FeeConfig(
    protocolAta,
    integratorAta,
    new Bps(100n),
    new Bps(100n),
    Bps.ZERO
)
const surplusOnlyFee = new FeeConfig(
    protocolAta,
    null,
    Bps.ZERO,
    Bps.ZERO,
    new Bps(100n)
)

const CREATE_ACCOUNTS = {PROTOCOL_DST_ATA: 10, INTEGRATOR_DST_ATA: 11}
const FILL_ACCOUNTS = {
    ESCROW_SRC_ATA: 7,
    PROTOCOL_DST_ATA: 15,
    INTEGRATOR_DST_ATA: 16
}
const CANCEL_BY_RESOLVER_ACCOUNTS = {
    ESCROW_SRC_ATA: 7,
    PROTOCOL_DST_ATA: 11,
    INTEGRATOR_DST_ATA: 12
}

const feeShapes = [
    ['no fees', undefined, null, null],
    ['integrator only', integratorOnlyFee, null, integratorAta],
    ['protocol only', protocolOnlyFee, protocolAta, null],
    ['both fees', bothFees, protocolAta, integratorAta],
    ['surplus only', surplusOnlyFee, protocolAta, null]
] as const

const dstMints = [
    ['native dst', Address.NATIVE],
    ['non-native dst', NON_NATIVE_DST]
] as const

describe('FusionSwapContract', () => {
    describe('fill', () => {
        it.each(dstMints)(
            'should keep read-only None placeholders for fee accounts when order has no fees (%s)',
            (_, dstMint) => {
                const ix = buildFill(newOrder(dstMint))

                expectAccount(
                    ix,
                    FILL_ACCOUNTS.PROTOCOL_DST_ATA,
                    NONE_PLACEHOLDER,
                    {isWritable: false}
                )
                expectAccount(
                    ix,
                    FILL_ACCOUNTS.INTEGRATOR_DST_ATA,
                    NONE_PLACEHOLDER,
                    {isWritable: false}
                )
            }
        )

        it('should pass writable integrator dst ATA for native-dst orders', () => {
            const ix = buildFill(newOrder(Address.NATIVE, integratorOnlyFee))

            expectAccount(ix, FILL_ACCOUNTS.INTEGRATOR_DST_ATA, integratorAta, {
                isWritable: true
            })
            expectAccount(
                ix,
                FILL_ACCOUNTS.PROTOCOL_DST_ATA,
                NONE_PLACEHOLDER,
                {
                    isWritable: false
                }
            )
        })

        it('should pass writable integrator dst ATA for non-native-dst orders', () => {
            const ix = buildFill(newOrder(NON_NATIVE_DST, integratorOnlyFee))

            expectAccount(ix, FILL_ACCOUNTS.INTEGRATOR_DST_ATA, integratorAta, {
                isWritable: true
            })
        })

        it('should pass writable protocol dst ATA for native-dst orders', () => {
            const ix = buildFill(newOrder(Address.NATIVE, protocolOnlyFee))

            expectAccount(ix, FILL_ACCOUNTS.PROTOCOL_DST_ATA, protocolAta, {
                isWritable: true
            })
            expectAccount(
                ix,
                FILL_ACCOUNTS.INTEGRATOR_DST_ATA,
                NONE_PLACEHOLDER,
                {isWritable: false}
            )
        })

        it('should pass both writable fee ATAs for native-dst orders', () => {
            const ix = buildFill(newOrder(Address.NATIVE, bothFees))

            expectAccount(ix, FILL_ACCOUNTS.PROTOCOL_DST_ATA, protocolAta, {
                isWritable: true
            })
            expectAccount(ix, FILL_ACCOUNTS.INTEGRATOR_DST_ATA, integratorAta, {
                isWritable: true
            })
        })

        it.each(dstMints)(
            'should pass protocol dst ATA for surplus-only fee config (%s)',
            (_, dstMint) => {
                const ix = buildFill(newOrder(dstMint, surplusOnlyFee))

                expectAccount(ix, FILL_ACCOUNTS.PROTOCOL_DST_ATA, protocolAta, {
                    isWritable: true
                })
                expectAccount(
                    ix,
                    FILL_ACCOUNTS.INTEGRATOR_DST_ATA,
                    NONE_PLACEHOLDER,
                    {isWritable: false}
                )
            }
        )
    })

    describe('cancelOrderByResolver', () => {
        it.each(dstMints)(
            'should keep read-only None placeholders for fee accounts when order has no fees (%s)',
            (_, dstMint) => {
                const ix = buildCancelByResolver(newOrder(dstMint))

                expectAccount(
                    ix,
                    CANCEL_BY_RESOLVER_ACCOUNTS.PROTOCOL_DST_ATA,
                    NONE_PLACEHOLDER,
                    {isWritable: false}
                )
                expectAccount(
                    ix,
                    CANCEL_BY_RESOLVER_ACCOUNTS.INTEGRATOR_DST_ATA,
                    NONE_PLACEHOLDER,
                    {isWritable: false}
                )
            }
        )

        it('should pass read-only integrator dst ATA for native-dst orders', () => {
            const ix = buildCancelByResolver(
                newOrder(Address.NATIVE, integratorOnlyFee)
            )

            expectAccount(
                ix,
                CANCEL_BY_RESOLVER_ACCOUNTS.INTEGRATOR_DST_ATA,
                integratorAta,
                {isWritable: false}
            )
            expectAccount(
                ix,
                CANCEL_BY_RESOLVER_ACCOUNTS.PROTOCOL_DST_ATA,
                NONE_PLACEHOLDER,
                {isWritable: false}
            )
        })

        it('should pass read-only integrator dst ATA for non-native-dst orders', () => {
            const ix = buildCancelByResolver(
                newOrder(NON_NATIVE_DST, integratorOnlyFee)
            )

            expectAccount(
                ix,
                CANCEL_BY_RESOLVER_ACCOUNTS.INTEGRATOR_DST_ATA,
                integratorAta,
                {isWritable: false}
            )
        })

        it('should pass read-only protocol dst ATA for native-dst orders', () => {
            const ix = buildCancelByResolver(
                newOrder(Address.NATIVE, protocolOnlyFee)
            )

            expectAccount(
                ix,
                CANCEL_BY_RESOLVER_ACCOUNTS.PROTOCOL_DST_ATA,
                protocolAta,
                {isWritable: false}
            )
        })

        it('should pass both read-only fee ATAs for native-dst orders', () => {
            const ix = buildCancelByResolver(newOrder(Address.NATIVE, bothFees))

            expectAccount(
                ix,
                CANCEL_BY_RESOLVER_ACCOUNTS.PROTOCOL_DST_ATA,
                protocolAta,
                {isWritable: false}
            )
            expectAccount(
                ix,
                CANCEL_BY_RESOLVER_ACCOUNTS.INTEGRATOR_DST_ATA,
                integratorAta,
                {isWritable: false}
            )
        })

        it.each(dstMints)(
            'should pass protocol dst ATA for surplus-only fee config (%s)',
            (_, dstMint) => {
                const ix = buildCancelByResolver(
                    newOrder(dstMint, surplusOnlyFee)
                )

                expectAccount(
                    ix,
                    CANCEL_BY_RESOLVER_ACCOUNTS.PROTOCOL_DST_ATA,
                    protocolAta,
                    {isWritable: false}
                )
            }
        )
    })

    describe('fee account consistency across builders', () => {
        it.each(dstMints)(
            'should pass the same fee accounts in create, fill and cancelOrderByResolver for every fee shape (%s)',
            (_, dstMint) => {
                for (const [, fees] of feeShapes) {
                    const order = newOrder(dstMint, fees)
                    const createIx = buildCreate(order)
                    const fillIx = buildFill(order)
                    const cancelIx = buildCancelByResolver(order)

                    const createProtocol = accountAt(
                        createIx,
                        CREATE_ACCOUNTS.PROTOCOL_DST_ATA
                    )
                    const createIntegrator = accountAt(
                        createIx,
                        CREATE_ACCOUNTS.INTEGRATOR_DST_ATA
                    )

                    expect(
                        accountAt(fillIx, FILL_ACCOUNTS.PROTOCOL_DST_ATA)
                    ).toBe(createProtocol)
                    expect(
                        accountAt(fillIx, FILL_ACCOUNTS.INTEGRATOR_DST_ATA)
                    ).toBe(createIntegrator)
                    expect(
                        accountAt(
                            cancelIx,
                            CANCEL_BY_RESOLVER_ACCOUNTS.PROTOCOL_DST_ATA
                        )
                    ).toBe(createProtocol)
                    expect(
                        accountAt(
                            cancelIx,
                            CANCEL_BY_RESOLVER_ACCOUNTS.INTEGRATOR_DST_ATA
                        )
                    ).toBe(createIntegrator)
                }
            }
        )

        it.each(dstMints)(
            'should derive escrow_src_ata equal to FusionOrder.getEscrow for every fee shape (%s)',
            (_, dstMint) => {
                for (const [, fees] of feeShapes) {
                    const order = newOrder(dstMint, fees)
                    const escrowAta = order
                        .getEscrow(maker, Address.TOKEN_PROGRAM_ID)
                        .toString()

                    expect(
                        accountAt(
                            buildFill(order),
                            FILL_ACCOUNTS.ESCROW_SRC_ATA
                        )
                    ).toBe(escrowAta)
                    expect(
                        accountAt(
                            buildCancelByResolver(order),
                            CANCEL_BY_RESOLVER_ACCOUNTS.ESCROW_SRC_ATA
                        )
                    ).toBe(escrowAta)
                }
            }
        )
    })

    describe('instruction round-trip', () => {
        it('should decode fill instruction of a fee-carrying native-dst order back to the original order', () => {
            const order = newOrder(Address.NATIVE, bothFees)

            expect(FusionOrder.fromFillInstruction(buildFill(order))).toEqual(
                order
            )
        })

        it('should decode cancelOrderByResolver instruction of a fee-carrying native-dst order back to the original order', () => {
            const order = newOrder(Address.NATIVE, bothFees)

            expect(
                FusionOrder.fromResolverCancelInstruction(
                    buildCancelByResolver(order)
                )
            ).toEqual(order)
        })

        it('should decode fill instruction of a no-fee native-dst order back to the original order', () => {
            const order = newOrder(Address.NATIVE)

            expect(FusionOrder.fromFillInstruction(buildFill(order))).toEqual(
                order
            )
        })
    })

    describe('unaffected builders', () => {
        it('should pass fee ATAs in create regardless of dst nativeness', () => {
            const ix = buildCreate(newOrder(Address.NATIVE, bothFees))

            expectAccount(ix, CREATE_ACCOUNTS.PROTOCOL_DST_ATA, protocolAta, {
                isWritable: false
            })
            expectAccount(
                ix,
                CREATE_ACCOUNTS.INTEGRATOR_DST_ATA,
                integratorAta,
                {isWritable: false}
            )
        })

        it('should build cancelOwnOrder without fee accounts', () => {
            const ix = FusionSwapContract.default().cancelOwnOrder(
                newOrder(Address.NATIVE, bothFees),
                {maker, srcTokenProgram: Address.TOKEN_PROGRAM_ID}
            )

            const accountKeys = ix.accounts.map((a) => a.pubkey.toString())
            expect(ix.accounts).toHaveLength(6)
            expect(accountKeys).not.toContain(protocolAta.toString())
            expect(accountKeys).not.toContain(integratorAta.toString())
        })

        it('should honor an explicit taker src account and whitelist on fill', () => {
            const takerSrcAccount = Address.fromBigInt(99n)
            const whitelist = Address.fromBigInt(88n)
            const order = newOrder(NON_NATIVE_DST)
            const ix = FusionSwapContract.default().fill(order, 50n, {
                maker,
                taker,
                srcTokenProgram: Address.TOKEN_PROGRAM_ID,
                dstTokenProgram: Address.TOKEN_PROGRAM_ID,
                takerSrcAccount,
                whitelist
            })

            expect(ix.accounts[8].pubkey.equal(takerSrcAccount)).toBe(true)
        })
    })
})

function newOrder(dstMint: Address, fees?: FeeConfig): FusionOrder {
    return FusionOrder.new(
        {
            srcMint: USDC,
            dstMint,
            srcAmount: 1000000n,
            minDstAmount: 2000000n,
            estimatedDstAmount: 2000000n,
            id: 1,
            receiver
        },
        AuctionDetails.noAuction(now(), 180),
        fees ? {fees} : undefined
    )
}

function buildCreate(order: FusionOrder): TransactionInstruction {
    return FusionSwapContract.default().create(order, {
        maker,
        srcTokenProgram: Address.TOKEN_PROGRAM_ID
    })
}

function buildFill(order: FusionOrder): TransactionInstruction {
    return FusionSwapContract.default().fill(order, 100n, {
        maker,
        taker,
        srcTokenProgram: Address.TOKEN_PROGRAM_ID,
        dstTokenProgram: Address.TOKEN_PROGRAM_ID
    })
}

function buildCancelByResolver(order: FusionOrder): TransactionInstruction {
    return FusionSwapContract.default().cancelOrderByResolver(order, {
        maker,
        resolver,
        srcTokenProgram: Address.TOKEN_PROGRAM_ID
    })
}

function accountAt(ix: TransactionInstruction, index: number): string {
    return ix.accounts[index].pubkey.toString()
}

function expectAccount(
    ix: TransactionInstruction,
    index: number,
    expected: Address,
    flags?: {isWritable: boolean}
): void {
    expect(accountAt(ix, index)).toBe(expected.toString())
    expect(ix.accounts[index].isSigner).toBe(false)

    if (flags) {
        expect(ix.accounts[index].isWritable).toBe(flags.isWritable)
    }
}
