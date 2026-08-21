import {Buffer} from 'buffer'
import {TransactionInstruction} from './transaction-instruction'
import {Address} from '../domains'
import {getAta} from '../utils'

/**
 * Creates the associated token account of `owner` for `mint` if it does not exist yet; a no-op otherwise.
 * `payer` funds the rent and must sign the transaction
 */
export class CreateAtaIdempotentInstruction extends TransactionInstruction {
    constructor(
        public readonly payer: Address,
        public readonly owner: Address,
        public readonly mint: Address,
        public readonly tokenProgramId: Address
    ) {
        super(
            Address.ASSOCIATED_TOKE_PROGRAM_ID,
            [
                {pubkey: payer, isSigner: true, isWritable: true},
                {
                    pubkey: getAta(owner, mint, tokenProgramId),
                    isSigner: false,
                    isWritable: true
                },
                {pubkey: owner, isSigner: false, isWritable: false},
                {pubkey: mint, isSigner: false, isWritable: false},
                {
                    pubkey: Address.SYSTEM_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false
                },
                {pubkey: tokenProgramId, isSigner: false, isWritable: false}
            ],
            Buffer.from([1])
        )
    }
}
