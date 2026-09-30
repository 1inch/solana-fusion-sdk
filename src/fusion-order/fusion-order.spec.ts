import {FusionOrder} from './fusion-order'
import {AuctionDetails} from './auction-details'
import {FeeConfig} from './fee-config'
import {ResolverCancellationConfig} from './resolver-cancellation-config'
import {Address, Bps} from '../domains'
import {now} from '../utils'
import {FusionSwapContract} from '../contracts'
import {AmountCalculator} from '../amount-calculator'

describe('Fusion Order', () => {
    it('should decode fusion order from instruction', () => {
        const order = FusionOrder.new(
            {
                srcMint: Address.WRAPPED_NATIVE,
                dstMint: new Address(
                    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
                ),
                srcAmount: 1000000000000000000n,
                minDstAmount: 1420000000n,
                estimatedDstAmount: 1420000000n,
                id: 1,
                receiver: Address.fromBigInt(1n)
            },
            AuctionDetails.noAuction(now(), 180)
        )

        const contract = FusionSwapContract.default()
        const createIx = contract.create(order, {
            maker: Address.fromBigInt(1n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID
        })

        const fillIx = contract.fill(order, 100n, {
            maker: Address.fromBigInt(1n),
            taker: Address.fromBigInt(2n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID,
            dstTokenProgram: Address.TOKEN_PROGRAM_ID
        })

        const cancelByResolverIx = contract.cancelOrderByResolver(order, {
            maker: Address.fromBigInt(1n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID,
            resolver: Address.fromBigInt(1n)
        })

        expect(FusionOrder.fromCreateInstruction(createIx)).toEqual(order)
        expect(FusionOrder.fromFillInstruction(fillIx)).toEqual(order)
        expect(
            FusionOrder.fromResolverCancelInstruction(cancelByResolverIx)
        ).toEqual(order)
    })

    it('should decode fusion order from instruction for native 1', () => {
        const order = FusionOrder.new(
            {
                srcMint: Address.NATIVE,
                dstMint: Address.fromBigInt(1n),
                srcAmount: 1000000000000000000n,
                minDstAmount: 1420000000n,
                estimatedDstAmount: 1420000000n,
                id: 1,
                receiver: Address.fromBigInt(1n)
            },
            AuctionDetails.noAuction(now(), 180)
        )

        const contract = FusionSwapContract.default()
        const createIx = contract.create(order, {
            maker: Address.fromBigInt(1n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID
        })

        const fillIx = contract.fill(order, 100n, {
            maker: Address.fromBigInt(1n),
            taker: Address.fromBigInt(2n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID,
            dstTokenProgram: Address.TOKEN_PROGRAM_ID
        })

        const cancelByResolverIx = contract.cancelOrderByResolver(order, {
            maker: Address.fromBigInt(1n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID,
            resolver: Address.fromBigInt(1n)
        })

        expect(FusionOrder.fromCreateInstruction(createIx)).toEqual(order)
        expect(FusionOrder.fromFillInstruction(fillIx)).toEqual(order)
        expect(
            FusionOrder.fromResolverCancelInstruction(cancelByResolverIx)
        ).toEqual(order)
    })

    it('should decode fusion order from instruction for native 2', () => {
        const order = FusionOrder.new(
            {
                srcMint: Address.fromBigInt(1n),
                dstMint: Address.NATIVE,
                srcAmount: 1000000000000000000n,
                minDstAmount: 1420000000n,
                estimatedDstAmount: 1420000000n,
                id: 1,
                receiver: Address.fromBigInt(1n)
            },
            AuctionDetails.noAuction(now(), 180)
        )

        const contract = FusionSwapContract.default()
        const createIx = contract.create(order, {
            maker: Address.fromBigInt(1n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID
        })

        const fillIx = contract.fill(order, 100n, {
            maker: Address.fromBigInt(1n),
            taker: Address.fromBigInt(2n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID,
            dstTokenProgram: Address.TOKEN_PROGRAM_ID
        })

        const cancelByResolverIx = contract.cancelOrderByResolver(order, {
            maker: Address.fromBigInt(1n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID,
            resolver: Address.fromBigInt(1n)
        })

        expect(FusionOrder.fromCreateInstruction(createIx)).toEqual(order)
        expect(FusionOrder.fromFillInstruction(fillIx)).toEqual(order)
        expect(
            FusionOrder.fromResolverCancelInstruction(cancelByResolverIx)
        ).toEqual(order)
    })

    it('should reject an order whose tokens are the same', () => {
        expect(() =>
            FusionOrder.new(
                {
                    srcMint: Address.WRAPPED_NATIVE,
                    dstMint: Address.WRAPPED_NATIVE,
                    srcAmount: 1000n,
                    minDstAmount: 1000n,
                    estimatedDstAmount: 1000n,
                    id: 1,
                    receiver: Address.fromBigInt(1n)
                },
                AuctionDetails.noAuction(now(), 180)
            )
        ).toThrow('tokens must be different')
    })

    it('should reject decoding an instruction of the wrong kind', () => {
        const order = sampleOrder()
        const contract = FusionSwapContract.default()
        const fillIx = contract.fill(order, 100n, {
            maker: Address.fromBigInt(1n),
            taker: Address.fromBigInt(2n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID,
            dstTokenProgram: Address.TOKEN_PROGRAM_ID
        })
        const createIx = contract.create(order, {
            maker: Address.fromBigInt(1n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID
        })

        expect(() => FusionOrder.fromCreateInstruction(fillIx)).toThrow(
            'invalid instruction'
        )
        expect(() => FusionOrder.fromFillInstruction(createIx)).toThrow(
            'invalid instruction'
        )
        expect(() =>
            FusionOrder.fromResolverCancelInstruction(createIx)
        ).toThrow('invalid instruction')
    })

    it('should round-trip through JSON including fee atas', () => {
        const order = FusionOrder.new(
            {
                srcMint: Address.WRAPPED_NATIVE,
                dstMint: new Address(
                    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
                ),
                srcAmount: 1_000_000n,
                minDstAmount: 2_000_000n,
                estimatedDstAmount: 2_100_000n,
                id: 7,
                receiver: Address.fromBigInt(9n)
            },
            new AuctionDetails({
                startTime: 1_700_000_000,
                duration: 180,
                initialRateBump: 500,
                points: [{delay: 60, coefficient: 200}]
            }),
            {
                orderExpirationDelay: 24,
                fees: new FeeConfig(
                    Address.fromBigInt(11n),
                    Address.fromBigInt(12n),
                    new Bps(100n),
                    new Bps(200n),
                    new Bps(100n)
                ),
                resolverCancellationConfig: new ResolverCancellationConfig(
                    10n,
                    30
                )
            }
        )

        const restored = FusionOrder.fromJSON(order.toJSON())

        expect(restored.toJSON()).toEqual(order.toJSON())
        expect(restored.getOrderHashBase58()).toEqual(
            order.getOrderHashBase58()
        )
        expect(restored.fees).toEqual(order.fees)
        expect(restored.resolverCancellationConfig).toEqual(
            order.resolverCancellationConfig
        )
        expect(restored.auctionDetails).toEqual(order.auctionDetails)
        expect(restored.id).toBe(7)
        expect(restored.srcAmount).toBe(1_000_000n)
        expect(restored.minDstAmount).toBe(2_000_000n)
        expect(restored.estimatedDstAmount).toBe(2_100_000n)
        expect(restored.deadline).toBe(1_700_000_000 + 180 + 24)
        expect(restored.auctionStartTime).toBe(1_700_000_000)
        expect(restored.auctionEndTime).toBe(1_700_000_180)
        expect(restored.srcAssetIsNative).toBe(false)
        expect(restored.dstAssetIsNative).toBe(false)
    })

    it('should expose null fees and keep the default resolver cancellation when none were set', () => {
        const order = sampleOrder()

        expect(order.fees).toBeNull()
        expect(order.resolverCancellationConfig).not.toBeNull()
        expect(order.resolverCancellationConfig?.maxCancellationPremium).toBe(
            1n
        )
    })

    it('should derive a stable escrow ata for the maker', () => {
        const order = sampleOrder()
        const maker = Address.fromBigInt(1n)
        const escrow = order.getEscrow(maker)

        expect(escrow).toBeInstanceOf(Address)
        expect(escrow.toString()).toEqual(
            order.getEscrow(maker, Address.TOKEN_PROGRAM_ID).toString()
        )
        expect(escrow.equal(maker)).toBe(false)
    })

    it('should price a fill from the auction and fee calculators', () => {
        const start = 1_700_000_000
        const order = FusionOrder.new(
            {
                srcMint: Address.WRAPPED_NATIVE,
                dstMint: new Address(
                    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
                ),
                srcAmount: 1000n,
                minDstAmount: 2000n,
                estimatedDstAmount: 2000n,
                id: 1,
                receiver: Address.fromBigInt(1n)
            },
            AuctionDetails.noAuction(start, 180),
            {
                fees: new FeeConfig(
                    Address.fromBigInt(11n),
                    Address.fromBigInt(12n),
                    Bps.fromPercent(1),
                    Bps.fromPercent(2),
                    Bps.fromPercent(50)
                )
            }
        )

        expect(order.calcTakingAmount(500n, start)).toBe(1000n)
        expect(order.getUserReceiveAmount(1000n, start)).toBe(1940n)
        expect(order.getIntegratorFee(start, 1000n)).toBe(40n)
        expect(order.getProtocolFee(start, 1000n)).toBe(20n)
        expect(order.getIntegratorFee(start)).toBe(40n)
        expect(order.getProtocolFee(start)).toBe(20n)
        expect(order.getCalculator()).toBeInstanceOf(AmountCalculator)
        expect(order.isExpiredAt(BigInt(order.deadline))).toBe(false)
        expect(order.isExpiredAt(BigInt(order.deadline + 1))).toBe(true)
    })
})

function sampleOrder(): FusionOrder {
    return FusionOrder.new(
        {
            srcMint: Address.WRAPPED_NATIVE,
            dstMint: new Address(
                'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
            ),
            srcAmount: 1000000000000000000n,
            minDstAmount: 1420000000n,
            estimatedDstAmount: 1420000000n,
            id: 1,
            receiver: Address.fromBigInt(1n)
        },
        AuctionDetails.noAuction(now(), 180)
    )
}
