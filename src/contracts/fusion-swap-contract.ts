import {BN, BorshCoder} from '@coral-xyz/anchor'
import assert from 'assert'
import {TransactionInstruction} from './transaction-instruction'
import {WhitelistContract} from './whitelist-contract'
import {getAta} from '../utils/addresses/ata'
import {FusionOrder} from '../fusion-order'
import {Address} from '../domains'
import {IDL} from '../idl/fusion-swap'
import {getPda} from '../utils/addresses/pda'

export class FusionSwapContract {
    static ADDRESS = new Address('9CnwB8RDNtRzRcxvkNqwgatRDENBCh2f56HgJLPStn8S')

    private readonly coder = new BorshCoder(IDL)

    constructor(public readonly programId: Address) {}

    static default(): FusionSwapContract {
        return new FusionSwapContract(FusionSwapContract.ADDRESS)
    }

    public create(
        order: FusionOrder,
        accounts: {
            maker: Address
            srcTokenProgram: Address
        }
    ): TransactionInstruction {
        const escrow = getPda(this.programId, [
            new TextEncoder().encode('escrow'),
            accounts.maker.toBuffer(),
            order.getOrderHash()
        ])

        return new TransactionInstruction(
            this.programId,
            [
                {
                    // 0. system_program
                    pubkey: Address.SYSTEM_PROGRAM_ID,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 1. escrow
                    pubkey: escrow,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 2. src_mint
                    pubkey: order.srcMint,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 3. src_token_program
                    pubkey: accounts.srcTokenProgram,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 4. escrow_src_ata
                    pubkey: getAta(
                        escrow,
                        order.srcMint,
                        accounts.srcTokenProgram
                    ),
                    isWritable: true,
                    isSigner: false
                },
                {
                    // 5. maker
                    pubkey: accounts.maker,
                    isSigner: true,
                    isWritable: true
                },
                {
                    // 6. maker_src_ata
                    pubkey: getAta(
                        accounts.maker,
                        order.srcMint,
                        accounts.srcTokenProgram
                    ),
                    isWritable: true,
                    isSigner: false
                },
                {
                    // 7. dst_mint
                    pubkey: order.dstMint,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 8. maker_receiver
                    pubkey: order.receiver,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 9. associated_token_program
                    pubkey: Address.ASSOCIATED_TOKE_PROGRAM_ID,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 10. protocol_dst_ata
                    pubkey: this.optional(order.fees?.protocolDstAta),
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 11. integrator_dst_ata
                    pubkey: this.optional(order.fees?.integratorDstAta),
                    isWritable: false,
                    isSigner: false
                }
            ],
            this.coder.instruction.encode('create', {
                order: order.asReduced()
            })
        )
    }

    public fill(
        order: FusionOrder,
        amount: bigint,
        accounts: {
            taker: Address
            maker: Address
            srcTokenProgram: Address
            dstTokenProgram: Address
            takerSrcAccount?: Address
            whitelist?: Address
        }
    ): TransactionInstruction {
        const whitelist = accounts.whitelist || WhitelistContract.ADDRESS

        const escrow = getPda(this.programId, [
            new TextEncoder().encode('escrow'),
            accounts.maker.toBuffer(),
            order.getOrderHash()
        ])

        return new TransactionInstruction(
            this.programId,
            [
                {
                    // taker
                    pubkey: accounts.taker,
                    isSigner: true,
                    isWritable: true
                },
                {
                    // resolver_access
                    pubkey: getPda(whitelist, [
                        new TextEncoder().encode('resolver_access'),
                        accounts.taker.toBuffer()
                    ]),
                    isWritable: false,
                    isSigner: false
                },
                {
                    // maker
                    pubkey: accounts.maker,
                    isSigner: false,
                    isWritable: true // closed account rent will go to maker
                },
                {
                    // maker_receiver
                    pubkey: order.receiver,
                    isSigner: false,
                    isWritable: false
                },
                {
                    // src_mint
                    pubkey: order.srcMint,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // dst_mint
                    pubkey: order.dstMint,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // escrow
                    pubkey: escrow,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // escrow_src_ata
                    pubkey: getAta(
                        escrow,
                        order.srcMint,
                        accounts.srcTokenProgram
                    ),
                    isWritable: true,
                    isSigner: false
                },
                // maker_dst_ata
                order.unwrapToNative
                    ? {
                          pubkey: this.programId,
                          isWritable: false,
                          isSigner: false
                      }
                    : {
                          pubkey: getAta(
                              order.receiver,
                              order.dstMint,
                              accounts.dstTokenProgram
                          ),
                          isWritable: true,
                          isSigner: false
                      },
                // protocol_dst_ata
                order.unwrapToNative || !order.fees?.protocolDstAta
                    ? {
                          pubkey: this.programId,
                          isWritable: false,
                          isSigner: false
                      }
                    : {
                          pubkey: order.fees.protocolDstAta,
                          isWritable: true,
                          isSigner: false
                      },
                // integrator_dst_ata
                order.unwrapToNative || !order.fees?.integratorDstAta
                    ? {
                          pubkey: this.programId,
                          isWritable: false,
                          isSigner: false
                      }
                    : {
                          pubkey: order.fees.integratorDstAta,
                          isWritable: true,
                          isSigner: false
                      },
                // taker_src_ata
                {
                    pubkey:
                        accounts.takerSrcAccount ??
                        getAta(
                            accounts.taker,
                            order.srcMint,
                            accounts.srcTokenProgram
                        ),
                    isWritable: true,
                    isSigner: false
                },
                // taker_dst_ata
                {
                    pubkey: getAta(
                        accounts.taker,
                        order.dstMint,
                        accounts.dstTokenProgram
                    ),
                    isWritable: true,
                    isSigner: false
                },
                {
                    // src_token_program
                    pubkey: accounts.srcTokenProgram,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // dst_token_program
                    pubkey: accounts.dstTokenProgram,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // system_program
                    pubkey: Address.SYSTEM_PROGRAM_ID,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // associated_token_program
                    pubkey: Address.ASSOCIATED_TOKE_PROGRAM_ID,
                    isWritable: false,
                    isSigner: false
                }
            ],
            this.coder.instruction.encode('fill', {
                reducedOrder: order.asReduced(),
                amount: new BN(amount.toString())
            })
        )
    }

    /**
     * Returns cancel instruction which only maker can submit
     */
    public cancelOwnOrder(
        order: FusionOrder,
        accounts: {
            maker: Address
            srcTokenProgram: Address
        }
    ): TransactionInstruction {
        const orderHash = order.getOrderHash()
        const escrow = getPda(this.programId, [
            new TextEncoder().encode('escrow'),
            accounts.maker.toBuffer(),
            orderHash
        ])

        return new TransactionInstruction(
            this.programId,
            [
                {
                    // 1. maker
                    pubkey: accounts.maker,
                    isSigner: true,
                    isWritable: true
                },
                {
                    // 2. src_mint
                    pubkey: order.srcMint,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 3. escrow
                    pubkey: escrow,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 4. escrow_src_ata
                    pubkey: getAta(
                        escrow,
                        order.srcMint,
                        accounts.srcTokenProgram
                    ),
                    isWritable: true,
                    isSigner: false
                },
                {
                    // 5. maker_src_ata
                    pubkey: getAta(
                        accounts.maker,
                        order.srcMint,
                        accounts.srcTokenProgram
                    ),
                    isWritable: true,
                    isSigner: false
                },
                {
                    // 6. src_token_program
                    pubkey: accounts.srcTokenProgram,
                    isWritable: false,
                    isSigner: false
                }
            ],
            this.coder.instruction.encode('cancel', {
                orderHash
            })
        )
    }

    /**
     * Returns cancel instruction which only resolver with access token can submit
     */
    public cancelOrderByResolver(
        order: FusionOrder,
        accounts: {
            maker: Address
            resolver: Address
            srcTokenProgram: Address
            whitelist?: Address
        }
    ): TransactionInstruction {
        assert(
            order.resolverCancellationConfig,
            'order can not be cancelled by resolver'
        )

        const textEncoder = new TextEncoder()
        const whitelist = accounts.whitelist || WhitelistContract.ADDRESS

        const orderHash = order.getOrderHash()
        const escrow = getPda(this.programId, [
            textEncoder.encode('escrow'),
            accounts.maker.toBuffer(),
            orderHash
        ])

        return new TransactionInstruction(
            this.programId,
            [
                {
                    // 1. resolver
                    pubkey: accounts.resolver,
                    isSigner: true,
                    isWritable: true
                },
                {
                    // 2. resolver_access
                    pubkey: getPda(whitelist, [
                        textEncoder.encode('resolver_access'),
                        accounts.resolver.toBuffer()
                    ]),
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 3. maker
                    pubkey: accounts.maker,
                    isWritable: true,
                    isSigner: false
                },
                {
                    // 4. maker_receiver
                    pubkey: order.receiver,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 5. src_mint
                    pubkey: order.srcMint,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 6. dst_mint
                    pubkey: order.dstMint,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 7. escrow
                    pubkey: escrow,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 8. escrow_src_ata
                    pubkey: getAta(
                        escrow,
                        order.srcMint,
                        accounts.srcTokenProgram
                    ),
                    isWritable: true,
                    isSigner: false
                },
                {
                    // 9. maker_src_ata
                    pubkey: getAta(
                        accounts.maker,
                        order.srcMint,
                        accounts.srcTokenProgram
                    ),
                    isWritable: true,
                    isSigner: false
                },

                // 10. protocol_dst_ata
                order.unwrapToNative || !order.fees?.protocolDstAta
                    ? {
                          pubkey: this.programId,
                          isWritable: false,
                          isSigner: false
                      }
                    : {
                          pubkey: order.fees.protocolDstAta,
                          isWritable: true,
                          isSigner: false
                      },
                // 11. integrator_dst_ata
                order.unwrapToNative || !order.fees?.integratorDstAta
                    ? {
                          pubkey: this.programId,
                          isWritable: false,
                          isSigner: false
                      }
                    : {
                          pubkey: order.fees.integratorDstAta,
                          isWritable: true,
                          isSigner: false
                      },
                {
                    // 12. src token program
                    pubkey: accounts.srcTokenProgram,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // 13. system_program
                    pubkey: Address.SYSTEM_PROGRAM_ID,
                    isWritable: false,
                    isSigner: false
                }
            ],
            this.coder.instruction.encode('cancelByResolver', {
                reducedOrder: order.asReduced()
            })
        )
    }

    private optional(acc: Address | undefined | null): Address {
        return acc ? acc : this.programId
    }
}
