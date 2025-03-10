import {Clock, ProgramTestContext, start} from 'solana-bankrun'
import {Keypair, PublicKey, Transaction} from '@solana/web3.js'
import {BorshCoder} from '@coral-xyz/anchor'
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import {
    airdropAccount,
    sol,
    SYSTEM_PROGRAM_ID,
    withBalanceChanges
} from './utils'
import {TestConnection} from './test-connection'
import {IDL as WhitelistIDL} from '../src/idl/whitelist'
import {getPda} from '../src/utils/addresses/pda'
import {Address, AuctionDetails, FusionOrder, FusionSwapContract} from '../src'
import {id} from '../src/utils/id'
import {now} from '../src/utils/time/now'
import {getAta} from '../src/utils/addresses/ata'
import {WhitelistContract} from '../src/contracts/whitelist-contract'

describe('FusionSwap', () => {
    const srcToken = Keypair.generate()
    const dstToken = Keypair.generate()
    const maker = Keypair.generate()
    const resolver = Keypair.generate()
    const owner = Keypair.generate()
    const whitelistProgramId = new PublicKey(
        WhitelistContract.ADDRESS.toBuffer()
    )
    const fusionSwapProgramId = new PublicKey(
        FusionSwapContract.ADDRESS.toBuffer()
    )

    let programTestCtx: ProgramTestContext

    beforeEach(async () => {
        programTestCtx = await start(
            [
                {
                    name: 'whitelist',
                    programId: whitelistProgramId
                },
                {
                    name: 'fusion_swap',
                    programId: fusionSwapProgramId
                }
            ],
            [
                airdropAccount(maker.publicKey, sol(100)),
                airdropAccount(resolver.publicKey, sol(100)),
                airdropAccount(owner.publicKey, sol(100))
            ]
        )

        await initWhitelist(
            programTestCtx,
            whitelistProgramId,
            owner,
            resolver.publicKey
        )

        await initTokens(programTestCtx, owner, [
            {
                mint: srcToken,
                owners: [
                    {
                        address: maker.publicKey,
                        amount: sol(100)
                    }
                ]
            },
            {
                mint: dstToken,
                owners: [
                    {
                        address: resolver.publicKey,
                        amount: sol(100)
                    }
                ]
            },
            {
                mint: srcToken,
                owners: [
                    {
                        address: resolver.publicKey,
                        amount: sol(0)
                    }
                ]
            }
        ])
    })

    it('should fill order with no fee', async () => {
        const order = new FusionOrder(
            {
                srcMint: Address.fromPublicKey(srcToken.publicKey),
                dstMint: Address.fromPublicKey(dstToken.publicKey),
                srcAmount: BigInt(sol(0.1)),
                minDstAmount: BigInt(sol(0.02)),
                estimatedDstAmount: BigInt(sol(0.02)),
                id: id(),
                receiver: Address.fromPublicKey(maker.publicKey)
            },
            AuctionDetails.noAuction(now(), 180)
        )

        const contract = FusionSwapContract.default()

        // region create escrow
        const ix = contract.create(order, {
            maker: Address.fromPublicKey(maker.publicKey),
            srcTokenProgram: Address.fromPublicKey(TOKEN_PROGRAM_ID)
        })

        const initTx = new Transaction().add({
            ...ix,
            programId: new PublicKey(ix.programId.toBuffer()),
            keys: ix.accounts.map((a) => ({
                ...a,
                pubkey: new PublicKey(a.pubkey.toBuffer())
            }))
        })

        initTx.recentBlockhash = programTestCtx.lastBlockhash
        initTx.sign(maker)

        const [makerDiff, escrowDiff] = await withBalanceChanges(
            programTestCtx,
            () => programTestCtx.banksClient.processTransaction(initTx),
            [
                getAta(
                    maker.publicKey,
                    srcToken.publicKey,
                    Address.TOKEN_PROGRAM_ID
                ),
                order.getEscrow(maker.publicKey)
            ]
        )

        expect(makerDiff).toEqual(-order.srcAmount)
        expect(escrowDiff).toEqual(order.srcAmount)

        // endregion create escrow

        // region fill
        const ix2 = contract.fill(order, order.srcAmount, {
            maker: Address.fromPublicKey(maker.publicKey),
            taker: Address.fromPublicKey(resolver.publicKey),
            srcTokenProgram: Address.fromPublicKey(TOKEN_PROGRAM_ID),
            dstTokenProgram: Address.fromPublicKey(TOKEN_PROGRAM_ID)
        })

        const fillTx = new Transaction().add({
            ...ix2,
            programId: new PublicKey(ix2.programId.toBuffer()),
            keys: ix2.accounts.map((a) => ({
                ...a,
                pubkey: new PublicKey(a.pubkey.toBuffer())
            }))
        })

        fillTx.recentBlockhash = programTestCtx.lastBlockhash
        fillTx.sign(resolver)

        // ┌────────────┐       ┌───────────┐
        // │srcEscrowAta│──SRC─▶│srcTakerAta│
        // └────────────┘       └───────────┘
        // ┌───────────┐       ┌───────────┐
        // │dstMakerAta│◀─DST──│dstTakerAta│
        // └───────────┘       └───────────┘
        const [srcEscrowAta, dstMakerAta, srcTakerAta, dstTakerAta] =
            await withBalanceChanges(
                programTestCtx,
                () => programTestCtx.banksClient.processTransaction(fillTx),
                [
                    order.getEscrow(maker.publicKey),
                    getAta(
                        maker.publicKey,
                        order.dstMint,
                        Address.TOKEN_PROGRAM_ID
                    ),
                    getAta(
                        resolver.publicKey,
                        order.srcMint,
                        Address.TOKEN_PROGRAM_ID
                    ),
                    getAta(
                        resolver.publicKey,
                        order.dstMint,
                        Address.TOKEN_PROGRAM_ID
                    )
                ]
            )

        expect(srcEscrowAta).toEqual(-srcTakerAta)
        expect(dstMakerAta).toEqual(-dstTakerAta)
        expect(dstMakerAta).toEqual(order.minDstAmount)
        expect(srcTakerAta).toEqual(order.srcAmount)
        // endregion fill
    })

    it('should cancel order by maker', async () => {
        const order = new FusionOrder(
            {
                srcMint: Address.fromPublicKey(srcToken.publicKey),
                dstMint: Address.fromPublicKey(dstToken.publicKey),
                srcAmount: BigInt(sol(0.1)),
                minDstAmount: BigInt(sol(0.02)),
                estimatedDstAmount: BigInt(sol(0.02)),
                id: id(),
                receiver: Address.fromPublicKey(maker.publicKey)
            },
            AuctionDetails.noAuction(now(), 180)
        )

        const contract = FusionSwapContract.default()

        // region create escrow
        const ix = contract.create(order, {
            maker: Address.fromPublicKey(maker.publicKey),
            srcTokenProgram: Address.fromPublicKey(TOKEN_PROGRAM_ID)
        })

        const initTx = new Transaction().add({
            ...ix,
            programId: new PublicKey(ix.programId.toBuffer()),
            keys: ix.accounts.map((a) => ({
                ...a,
                pubkey: new PublicKey(a.pubkey.toBuffer())
            }))
        })

        initTx.recentBlockhash = programTestCtx.lastBlockhash
        initTx.sign(maker)

        const [makerDiff, escrowDiff] = await withBalanceChanges(
            programTestCtx,
            () => programTestCtx.banksClient.processTransaction(initTx),
            [
                getAta(
                    maker.publicKey,
                    srcToken.publicKey,
                    Address.TOKEN_PROGRAM_ID
                ),
                order.getEscrow(maker.publicKey)
            ]
        )

        expect(makerDiff).toEqual(-order.srcAmount)
        expect(escrowDiff).toEqual(order.srcAmount)

        // endregion create escrow

        // region cancel escrow
        const ix2 = contract.cancelOwnOrder(order, {
            maker: Address.fromPublicKey(maker.publicKey),
            srcTokenProgram: Address.fromPublicKey(TOKEN_PROGRAM_ID)
        })

        const cancelTx = new Transaction().add({
            ...ix2,
            programId: new PublicKey(ix2.programId.toBuffer()),
            keys: ix2.accounts.map((a) => ({
                ...a,
                pubkey: new PublicKey(a.pubkey.toBuffer())
            }))
        })

        cancelTx.recentBlockhash = programTestCtx.lastBlockhash
        cancelTx.sign(maker)

        // ┌────────────┐       ┌───────────┐
        // │srcEscrowAta│──SRC─▶│srcMakerAta│
        // └────────────┘       └───────────┘
        const [srcEscrowAta, srcMakerAta] = await withBalanceChanges(
            programTestCtx,
            () => programTestCtx.banksClient.processTransaction(cancelTx),
            [
                order.getEscrow(maker.publicKey),
                getAta(maker.publicKey, order.srcMint, Address.TOKEN_PROGRAM_ID)
            ]
        )

        expect(srcEscrowAta).toEqual(-srcMakerAta)
        // endregion cancel escrow
    })

    it('should cancel order by resolver', async () => {
        const order = new FusionOrder(
            {
                srcMint: Address.fromPublicKey(srcToken.publicKey),
                dstMint: Address.fromPublicKey(dstToken.publicKey),
                srcAmount: BigInt(sol(0.1)),
                minDstAmount: BigInt(sol(0.02)),
                estimatedDstAmount: BigInt(sol(0.02)),
                id: id(),
                receiver: Address.fromPublicKey(maker.publicKey)
            },
            AuctionDetails.noAuction(now(), 1)
        )

        const contract = FusionSwapContract.default()

        // region create escrow
        const ix = contract.create(order, {
            maker: Address.fromPublicKey(maker.publicKey),
            srcTokenProgram: Address.fromPublicKey(TOKEN_PROGRAM_ID)
        })

        const initTx = new Transaction().add({
            ...ix,
            programId: new PublicKey(ix.programId.toBuffer()),
            keys: ix.accounts.map((a) => ({
                ...a,
                pubkey: new PublicKey(a.pubkey.toBuffer())
            }))
        })

        initTx.recentBlockhash = programTestCtx.lastBlockhash
        initTx.sign(maker)

        const [makerDiff, escrowDiff] = await withBalanceChanges(
            programTestCtx,
            () => programTestCtx.banksClient.processTransaction(initTx),
            [
                getAta(
                    maker.publicKey,
                    srcToken.publicKey,
                    Address.TOKEN_PROGRAM_ID
                ),
                order.getEscrow(maker.publicKey)
            ]
        )

        expect(makerDiff).toEqual(-order.srcAmount)
        expect(escrowDiff).toEqual(order.srcAmount)

        // endregion create escrow

        // expire order
        const clock = await programTestCtx.banksClient.getClock()
        programTestCtx.setClock(advanceClock(clock, 30n))

        // region cancel escrow
        const ix2 = contract.cancelOrderByResolver(order, {
            maker: Address.fromPublicKey(maker.publicKey),
            srcTokenProgram: Address.fromPublicKey(TOKEN_PROGRAM_ID),
            resolver: Address.fromPublicKey(resolver.publicKey)
        })

        const cancelTx = new Transaction().add({
            ...ix2,
            programId: new PublicKey(ix2.programId.toBuffer()),
            keys: ix2.accounts.map((a) => ({
                ...a,
                pubkey: new PublicKey(a.pubkey.toBuffer())
            }))
        })

        cancelTx.recentBlockhash = programTestCtx.lastBlockhash
        cancelTx.sign(resolver)

        // ┌────────────┐       ┌───────────┐
        // │srcEscrowAta│──SRC─▶│srcMakerAta│
        // └────────────┘       └───────────┘
        const [srcEscrowAta, srcMakerAta] = await withBalanceChanges(
            programTestCtx,
            () => programTestCtx.banksClient.processTransaction(cancelTx),
            [
                order.getEscrow(maker.publicKey),
                getAta(maker.publicKey, order.srcMint, Address.TOKEN_PROGRAM_ID)
            ]
        )

        expect(srcEscrowAta).toEqual(-srcMakerAta)
        // endregion cancel escrow
    })
})

async function initWhitelist(
    testCtx: ProgramTestContext,
    programId: PublicKey,
    owner: Keypair,
    resolver: PublicKey
): Promise<void> {
    const whitelistCoder = new BorshCoder(WhitelistIDL)

    // region init
    const initTx = new Transaction({
        feePayer: owner.publicKey,
        recentBlockhash: testCtx.lastBlockhash
    }).add({
        keys: [
            {pubkey: owner.publicKey, isSigner: true, isWritable: false},
            {
                pubkey: new PublicKey(
                    getPda(programId, [
                        new TextEncoder().encode('whitelist_state')
                    ]).toBuffer()
                ),
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: SYSTEM_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            }
        ],
        data: whitelistCoder.instruction.encode('initialize', {}),
        programId: programId
    })

    initTx.sign(owner)
    await testCtx.banksClient.processTransaction(initTx)
    // endregion init
    // region register
    const registerTx = new Transaction({
        feePayer: owner.publicKey,
        recentBlockhash: testCtx.lastBlockhash
    }).add({
        keys: [
            {pubkey: owner.publicKey, isSigner: true, isWritable: false},
            {
                pubkey: new PublicKey(
                    getPda(programId, [
                        new TextEncoder().encode('whitelist_state')
                    ]).toBuffer()
                ),
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: new PublicKey(
                    getPda(programId, [
                        new TextEncoder().encode('resolver_access'),
                        resolver.toBuffer()
                    ]).toBuffer()
                ),
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: SYSTEM_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            }
        ],
        data: whitelistCoder.instruction.encode('register', {user: resolver}),
        programId: programId
    })

    registerTx.sign(owner)
    await testCtx.banksClient.processTransaction(registerTx)
    // endregion register
}

async function initTokens(
    testCtx: ProgramTestContext,
    owner: Keypair,
    tokens: {
        mint: Keypair
        tokenProgram?: PublicKey
        owners: {address: PublicKey; amount: number}[]
    }[]
): Promise<void> {
    const connection = TestConnection.new(testCtx)

    for (const token of tokens) {
        await createMint(
            connection,
            owner,
            owner.publicKey,
            owner.publicKey,
            9,
            token.mint,
            undefined,
            token.tokenProgram
        )

        for (const user of token.owners) {
            const ata = await getOrCreateAssociatedTokenAccount(
                connection,
                owner,
                token.mint.publicKey,
                user.address,
                false,
                undefined,
                undefined,
                token.tokenProgram
            )

            await mintTo(
                connection,
                owner,
                token.mint.publicKey,
                ata.address,
                owner,
                user.amount,
                undefined,
                undefined,
                token.tokenProgram
            )
        }
    }
}

function advanceClock(clock: Clock, sec: bigint): Clock {
    return new Clock(
        clock.slot,
        clock.epochStartTimestamp,
        clock.epoch,
        clock.leaderScheduleEpoch,
        clock.unixTimestamp + sec
    )
}
