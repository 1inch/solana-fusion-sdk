import {BN, BorshCoder} from '@coral-xyz/anchor'
import * as borsh from 'borsh'
import * as crypto from 'node:crypto'
import {Buffer} from 'buffer'
import assert from 'assert'
import {AuctionDetails} from './auction-details'

import {FeeConfig} from './fee-config'
import {OrderInfoData} from './types'
import {Address, AddressLike, Bps} from '../domains'
import {AmountCalculator, AuctionCalculator} from '../amount-calculator'
import {FeeCalculator} from '../amount-calculator/fee-calculator/fee-calculator'
import {FusionSwapContract} from '../contracts'
import {getPda} from '../utils/addresses/pda'
import {getAta} from '../utils/addresses/ata'
import {TransactionInstruction} from '../contracts/transaction-instruction'
import {IDL} from '../idl/fusion-swap'

export class FusionOrder {
    private static DefaultExtra = {
        unwrapNative: false,
        orderExpirationDelay: 12,
        fees: FeeConfig.ZERO
    }

    private readonly orderConfig: {
        id: number // u32
        srcAmount: bigint // u64
        minDstAmount: bigint // u64
        estimatedDstAmount: bigint // u64
        expirationTime: number // u32
        nativeDstAsset: boolean
        receiver: Address
        fees: FeeConfig
        dutchAuctionData: AuctionDetails
        srcMint: Address
        dstMint: Address
    }

    public constructor(
        orderInfo: OrderInfoData,
        auctionDetails: AuctionDetails,
        extra: {
            unwrapNative?: boolean
            /**
             * Order will expire in `orderExpirationDelay` after auction ends
             * Default 12s
             */
            orderExpirationDelay?: number
            fees?: FeeConfig
        } = FusionOrder.DefaultExtra
    ) {
        // validate amounts

        const unwrapNative =
            extra.unwrapNative ?? FusionOrder.DefaultExtra.unwrapNative

        const orderExpirationDelay =
            extra.orderExpirationDelay ??
            FusionOrder.DefaultExtra.orderExpirationDelay

        const deadline =
            auctionDetails.startTime +
            auctionDetails.duration +
            orderExpirationDelay

        const fees = extra.fees || FusionOrder.DefaultExtra.fees

        this.orderConfig = {
            ...orderInfo,
            dutchAuctionData: auctionDetails,
            fees,
            nativeDstAsset: unwrapNative,
            expirationTime: deadline
        }
    }

    get fees(): FeeConfig | null {
        return this.orderConfig.fees.isZero() ? null : this.orderConfig.fees
    }

    get dstMint(): Address {
        return this.orderConfig.dstMint
    }

    get srcMint(): Address {
        return this.orderConfig.srcMint
    }

    get dstAmount(): bigint {
        return this.orderConfig.minDstAmount
    }

    get srcAmount(): bigint {
        return this.orderConfig.srcAmount
    }

    /**
     * Receiver of funds
     */
    get receiver(): Address {
        return this.orderConfig.receiver
    }

    /**
     * Timestamp in sec
     */
    get deadline(): number {
        return this.orderConfig.expirationTime
    }

    /**
     * Timestamp in sec
     */
    get auctionStartTime(): number {
        return this.orderConfig.dutchAuctionData.startTime
    }

    /**
     * Timestamp in sec
     */
    get auctionEndTime(): number {
        const {startTime, duration} = this.orderConfig.dutchAuctionData

        return startTime + duration
    }

    get auctionDetails(): AuctionDetails {
        return this.orderConfig.dutchAuctionData
    }

    get id(): number {
        return this.orderConfig.id
    }

    get unwrapToNative(): boolean {
        return this.orderConfig.nativeDstAsset
    }

    static fromCreateInstruction(ix: TransactionInstruction): FusionOrder {
        const _ix = new BorshCoder(IDL).instruction.decode(ix.data)

        if (!_ix || _ix.name !== 'create') {
            throw new Error('invalid instruction')
        }

        assert('order' in _ix.data)

        const reducedConfig = _ix.data.order as ReducedOrderConfig

        const srcMint = ix.accounts[1]
        const dstMint = ix.accounts[2]
        const receiverAccMeta = ix.accounts[4]
        const protocolDstAta = ix.accounts[7]
        const integratorDstAta = ix.accounts[8]

        expect(receiverAccMeta)
        expect(srcMint)
        expect(dstMint)
        expect(protocolDstAta)
        expect(integratorDstAta)

        const {dutchAuctionData: auction, fee} = reducedConfig

        const orderExpirationDelay =
            reducedConfig.expirationTime - auction.duration - auction.startTime

        return new FusionOrder(
            {
                srcMint: srcMint.pubkey,
                dstMint: dstMint.pubkey,
                id: reducedConfig.id,
                srcAmount: BigInt(reducedConfig.srcAmount.toString()),
                minDstAmount: BigInt(reducedConfig.minDstAmount.toString()),
                estimatedDstAmount: BigInt(
                    reducedConfig.estimatedDstAmount.toString()
                ),
                receiver: receiverAccMeta.pubkey
            },
            new AuctionDetails({
                startTime: auction.startTime,
                duration: auction.duration,
                initialRateBump: auction.initialRateBump,
                points: auction.pointsAndTimeDeltas.map((p) => ({
                    coefficient: p.rateBump,
                    delay: p.timeDelta
                }))
            }),
            {
                unwrapNative: reducedConfig.nativeDstAsset,
                orderExpirationDelay,
                fees: new FeeConfig(
                    protocolDstAta.pubkey.equal(ix.programId)
                        ? null
                        : protocolDstAta.pubkey,
                    integratorDstAta.pubkey.equal(ix.programId)
                        ? null
                        : integratorDstAta.pubkey,
                    Bps.fromFraction(fee.protocolFee, FeeConfig.BASE_1E5),
                    Bps.fromFraction(fee.integratorFee, FeeConfig.BASE_1E5),
                    Bps.fromFraction(fee.surplusPercentage, FeeConfig.BASE_1E2)
                )
            }
        )
    }

    public build(): OrderConfig {
        const {fees} = this.orderConfig

        const reduced = this.asReduced()

        return {
            ...reduced,
            receiver: this.orderConfig.receiver.toBuffer(),
            fee: {
                ...reduced.fee,
                protocolDstAta: fees.protocolDstAta?.toBuffer() || null,
                integratorDstAta: fees.integratorDstAta?.toBuffer() || null
            },
            srcMint: this.orderConfig.srcMint.toBuffer(),
            dstMint: this.orderConfig.dstMint.toBuffer()
        }
    }

    public asReduced(): ReducedOrderConfig {
        const {fees, dutchAuctionData: auction} = this.orderConfig

        return {
            id: this.orderConfig.id,
            srcAmount: new BN(this.orderConfig.srcAmount),
            minDstAmount: new BN(this.orderConfig.minDstAmount),
            estimatedDstAmount: new BN(this.orderConfig.estimatedDstAmount),
            expirationTime: this.orderConfig.expirationTime,
            nativeDstAsset: this.orderConfig.nativeDstAsset,
            fee: {
                protocolFee: fees.protocolFee.toFraction(FeeConfig.BASE_1E5),
                integratorFee: fees.integratorFee.toFraction(
                    FeeConfig.BASE_1E5
                ),
                surplusPercentage: fees.surplusShare.toFraction(
                    FeeConfig.BASE_1E2
                )
            },
            dutchAuctionData: {
                startTime: auction.startTime,
                duration: auction.duration,
                initialRateBump: auction.initialRateBump,
                pointsAndTimeDeltas: auction.points.map((p) => ({
                    rateBump: p.coefficient,
                    timeDelta: p.delay
                }))
            }
        }
    }

    /**
     * Returns orderHash
     */
    public getOrderHash(): Buffer {
        const encoded = borsh.serialize(OrderConfigSchema, this.build())

        return crypto.createHash('sha256').update(encoded).digest()
    }

    /**
     * Returns escrow ata for src token
     */
    public getEscrow(
        maker: AddressLike,
        /**
         * Src token program id - TOKEN_PROGRAM_ID or TOKEN_2020_PROGRAM_ID
         */
        srcTokenProgram: Address = Address.TOKEN_PROGRAM_ID,
        /**
         * FusionSwap program id
         */
        programId: Address = FusionSwapContract.ADDRESS
    ): Address {
        const escrow = getPda(programId, [
            new TextEncoder().encode('escrow'),
            maker.toBuffer(),
            this.getOrderHash()
        ])

        return getAta(escrow, this.srcMint, srcTokenProgram)
    }

    /**
     * Calculates required taking amount to fill order for passed `makingAmount` at block time `time`
     *
     * @param time execution time in sec
     * @param makingAmount maker swap amount
     * */
    public calcTakingAmount(makingAmount: bigint, time: number): bigint {
        const takingAmount = AmountCalculator.calcTakingAmount(
            makingAmount,
            this.srcAmount,
            this.dstAmount
        )

        return this.getCalculator().getRequiredTakingAmount(takingAmount, time)
    }

    // /**
    //  * How much user will receive in taker asset
    //  *
    //  * @param taker who will fill order
    //  * @param makingAmount maker swap amount
    //  * @param time block time at which order will be filled
    //  * @param blockBaseFee base fee of block at which order will be filled
    //  */
    // public getUserReceiveAmount(
    //     taker: Address,
    //     makingAmount: bigint,
    //     time: bigint,
    //     blockBaseFee = 0n
    // ): bigint {
    //     const takingAmount = calcTakingAmount(
    //         makingAmount,
    //         this.makingAmount,
    //         this.takingAmount
    //     )
    //
    //     return this.getAmountCalculator().getUserTakingAmountAmount(
    //         taker,
    //         takingAmount,
    //         time,
    //         blockBaseFee
    //     )
    // }

    // /**
    //  * Fee in `takerAsset` which integrator gets to integrator wallet
    //  *
    //  * @param taker who will fill order
    //  * @param makingAmount maker swap amount
    //  * @param time block time at which order will be filled
    //  * @param blockBaseFee base fee of block at which order will be filled
    //  */
    // public getIntegratorFee(
    //     taker: Address,
    //     time: bigint,
    //     blockBaseFee = 0n,
    //     makingAmount = this.makingAmount
    // ): bigint {
    //     const takingAmount = calcTakingAmount(
    //         makingAmount,
    //         this.makingAmount,
    //         this.takingAmount
    //     )
    //
    //     return (
    //         this.getAmountCalculator().getIntegratorFee(
    //             taker,
    //             takingAmount,
    //             time,
    //             blockBaseFee
    //         ) ?? 0n
    //     )
    // }

    // /**
    //  * Fee in `takerAsset` which protocol gets as share from integrator fee
    //  *
    //  * @param taker who will fill order
    //  * @param makingAmount maker swap amount
    //  * @param time block time at which order will be filled
    //  * @param blockBaseFee base fee of block at which order will be filled
    //  */
    // public getProtocolShareOfIntegratorFee(
    //     taker: Address,
    //     time: bigint,
    //     blockBaseFee = 0n,
    //     makingAmount = this.makingAmount
    // ): bigint {
    //     const takingAmount = calcTakingAmount(
    //         makingAmount,
    //         this.makingAmount,
    //         this.takingAmount
    //     )
    //
    //     return (
    //         this.getAmountCalculator().getProtocolShareOfIntegratorFee(
    //             taker,
    //             takingAmount,
    //             time,
    //             blockBaseFee
    //         ) ?? 0n
    //     )
    // }

    // /**
    //  * Fee in `takerAsset` which protocol gets
    //  * It equals to `share from integrator fee plus resolver fee`
    //  *
    //  * @param taker who will fill order
    //  * @param makingAmount maker swap amount
    //  * @param time block time at which order will be filled
    //  * @param blockBaseFee base fee of block at which order will be filled
    //  */
    // public getProtocolFee(
    //     taker: Address,
    //     time: bigint,
    //     blockBaseFee = 0n,
    //     makingAmount = this.makingAmount
    // ): bigint {
    //     const takingAmount = calcTakingAmount(
    //         makingAmount,
    //         this.makingAmount,
    //         this.takingAmount
    //     )
    //
    //     return (
    //         this.getAmountCalculator().getProtocolFee(
    //             taker,
    //             takingAmount,
    //             time,
    //             blockBaseFee
    //         ) ?? 0n
    //     )
    // }

    /**
     * Check is order expired at a given time
     *
     * @param time timestamp in seconds
     */
    public isExpiredAt(time: bigint): boolean {
        return time > this.deadline
    }

    public getCalculator(): AmountCalculator {
        return new AmountCalculator(
            AuctionCalculator.fromAuctionData(
                this.orderConfig.dutchAuctionData
            ),
            FeeCalculator.fromFeeConfig(this.orderConfig.fees)
        )
    }
}

type ReducedOrderConfig = {
    id: number
    srcAmount: BN
    minDstAmount: BN
    estimatedDstAmount: BN
    expirationTime: number
    nativeDstAsset: boolean
    fee: {
        protocolFee: number
        integratorFee: number
        surplusPercentage: number
    }
    dutchAuctionData: {
        startTime: number
        duration: number
        initialRateBump: number
        pointsAndTimeDeltas: {
            rateBump: number
            timeDelta: number
        }[]
    }
}

type OrderConfig = ReducedOrderConfig & {
    receiver: Buffer
    srcMint: Buffer
    dstMint: Buffer
    fee: ReducedOrderConfig['fee'] & {
        protocolDstAta: Buffer | null
        integratorDstAta: Buffer | null
    }
}

const OrderConfigSchema = {
    struct: {
        id: 'u32',
        srcAmount: 'u64',
        minDstAmount: 'u64',
        estimatedDstAmount: 'u64',
        expirationTime: 'u32',
        nativeDstAsset: 'bool',
        receiver: {array: {type: 'u8', len: 32}},
        fee: {
            struct: {
                protocolDstAta: {option: {array: {type: 'u8', len: 32}}},
                integratorDstAta: {option: {array: {type: 'u8', len: 32}}},
                protocolFee: 'u16',
                integratorFee: 'u16',
                surplusPercentage: 'u8'
            }
        },
        dutchAuctionData: {
            struct: {
                startTime: 'u32',
                duration: 'u32',
                initialRateBump: 'u16',
                pointsAndTimeDeltas: {
                    array: {
                        type: {
                            struct: {
                                rateBump: 'u16',
                                timeDelta: 'u16'
                            }
                        }
                    }
                }
            }
        },
        srcMint: {array: {type: 'u8', len: 32}},
        dstMint: {array: {type: 'u8', len: 32}}
    }
}
