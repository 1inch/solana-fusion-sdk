import {BN, BorshCoder} from '@coral-xyz/anchor'
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
                    // system_program
                    pubkey: Address.SYSTEM_PROGRAM_ID,
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
                    // src_mint
                    pubkey: order.srcMint,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // src_token_program
                    pubkey: accounts.srcTokenProgram,
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
                {
                    // maker
                    pubkey: accounts.maker,
                    isSigner: true,
                    isWritable: true
                },
                {
                    // maker_src_ata
                    pubkey: getAta(
                        accounts.maker,
                        order.srcMint,
                        accounts.srcTokenProgram
                    ),
                    isWritable: true,
                    isSigner: false
                },
                {
                    // dst_mint
                    pubkey: order.dstMint,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // maker_receiver
                    pubkey: order.receiver,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // associated_token_program
                    pubkey: Address.ASSOCIATED_TOKE_PROGRAM_ID,
                    isWritable: false,
                    isSigner: false
                },
                {
                    // protocol_dst_ata
                    pubkey: this.optional(order.fees?.protocolDstAta),
                    isWritable: false,
                    isSigner: false
                },
                {
                    // integrator_dst_ata
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
                    // taker
                    pubkey: accounts.taker,
                    isSigner: true,
                    isWritable: true
                },
                {
                    // resolver_access
                    pubkey: getPda(WhitelistContract.ADDRESS, [
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

    private optional(acc: Address | undefined | null): Address {
        return acc ? acc : this.programId
    }
}
