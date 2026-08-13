import {Buffer} from 'buffer'
import {CreateAtaIdempotentInstruction} from './create-ata-idempotent.instruction'
import {Address} from '../domains'

describe('CreateAtaIdempotentInstruction', () => {
    it('should pin the associated-token-program account layout', () => {
        const payer = new Address(
            'GZctHpWXmsZC1YHACTGGcHhYxjdRqQvTpYkb9LMvxDib'
        )
        const owner = new Address('hf5iUqe8DAWpHfXhbhJ4rphgETAzjmeH5HGdjM7WSjp')
        const mint = new Address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

        const instruction = new CreateAtaIdempotentInstruction(
            payer,
            owner,
            mint,
            Address.TOKEN_PROGRAM_ID
        )

        expect(instruction.programId).toEqual(
            Address.ASSOCIATED_TOKE_PROGRAM_ID
        )
        expect(instruction.data).toEqual(Buffer.from([1]))
        expect(instruction.accounts).toEqual([
            {pubkey: payer, isSigner: true, isWritable: true},
            {
                pubkey: new Address(
                    '92vZyDx2g61nb2V2piPhqiG9Kk9pZ6sQfiyktCrfg5sV'
                ),
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
            {
                pubkey: Address.TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            }
        ])
    })
})
