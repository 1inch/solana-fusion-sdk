import {ProgramTestContext} from 'solana-bankrun'
import {
    AccountInfo,
    Connection,
    PublicKey,
    RpcResponseAndContext,
    SignatureResult,
    Signer,
    Transaction,
    TransactionSignature
} from '@solana/web3.js'

import bs58 from 'bs58'
import assert from 'assert'

import {Buffer} from 'buffer'
import {sleep} from './utils'

export class TestConnection {
    constructor(private readonly testCtx: ProgramTestContext) {}

    static new(testCtx: ProgramTestContext): Connection {
        return new TestConnection(testCtx) as unknown as Connection
    }

    async getMinimumBalanceForRentExemption(mintLen: number): Promise<number> {
        const rent = await this.testCtx.banksClient.getRent()

        return Number(rent.minimumBalance(BigInt(mintLen)))
    }

    async sendTransaction(
        transaction: Transaction,
        signers: Array<Signer>
    ): Promise<TransactionSignature> {
        transaction.recentBlockhash = this.testCtx.lastBlockhash
        transaction.sign(...signers)

        await this.testCtx.banksClient.sendTransaction(transaction)

        assert(transaction.signature)

        await sleep(100) // IDK, for some reason the bank client can't find tx without this sleep

        return bs58.encode(transaction.signature) as TransactionSignature
    }

    async confirmTransaction(
        hash: TransactionSignature
    ): Promise<RpcResponseAndContext<SignatureResult>> {
        let i = 10
        while (i--) {
            const status =
                await this.testCtx.banksClient.getTransactionStatus(hash)

            if (status) {
                return {
                    context: {slot: Number(status.slot)},
                    value: {err: status.err}
                }
            }

            await sleep(1000)
        }

        throw new Error(`transaction not confirmed: ${hash}`)
    }

    async getAccountInfo(
        publicKey: PublicKey
    ): Promise<AccountInfo<Buffer> | null> {
        const acc = await this.testCtx.banksClient.getAccount(publicKey)

        return acc ? {...acc, data: Buffer.from(acc.data)} : null
    }
}
