import {Quote} from './quote'
import {Preset} from './preset'
import {QuoteFee} from './quote-fee'
import {QuoteDTO, QuoteFeeDTO} from '../api'
import {AuctionDetails, FusionOrder} from '../fusion-order'
import {Address, Bps} from '../domains'
import {getAta} from '../utils'

jest.mock('../utils', () => ({
    ...jest.requireActual('../utils'),
    id: (): number => 424242,
    now: (): number => 1754820000
}))

describe('Quote', () => {
    const srcToken = new Address('So11111111111111111111111111111111111111112')
    const dstToken = new Address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
    const signer = new Address('GZctHpWXmsZC1YHACTGGcHhYxjdRqQvTpYkb9LMvxDib')
    const receiver = 'hf5iUqe8DAWpHfXhbhJ4rphgETAzjmeH5HGdjM7WSjp'
    const protocolReceiver = 'CckkBNtGaSb61k4y1uzG7WFgerhExf7b82Z8NU4ipFX4'

    const cacheFee: QuoteFeeDTO = {
        integratorFeeBps: 48,
        protocolFeeBps: 32,
        receiver,
        protocolReceiver,
        dstTokenProgram: Address.TOKEN_PROGRAM_ID.toString()
    }

    it('should wrap the fee block of a fee-bearing payload into domain types', () => {
        const quote = Quote.fromJSON(
            srcToken,
            dstToken,
            signer,
            quoteDto({fee: cacheFee})
        )

        expect(quote.fee).toBeInstanceOf(QuoteFee)
        expect(quote.fee?.receiver).toBeInstanceOf(Address)
        expect(quote.fee?.protocolReceiver).toBeInstanceOf(Address)
        expect(quote.fee?.dstTokenProgram).toBeInstanceOf(Address)
        expect(quote.fee).toEqual(
            new QuoteFee(
                new Bps(48n),
                new Bps(32n),
                new Address(receiver),
                new Address(protocolReceiver),
                Address.TOKEN_PROGRAM_ID
            )
        )
    })

    it('should wrap a protocol-only fee block with a null receiver', () => {
        const quote = Quote.fromJSON(
            srcToken,
            dstToken,
            signer,
            quoteDto({
                fee: {...cacheFee, integratorFeeBps: 0, receiver: null}
            })
        )

        expect(quote.fee).toEqual(
            new QuoteFee(
                new Bps(0n),
                new Bps(32n),
                null,
                new Address(protocolReceiver),
                Address.TOKEN_PROGRAM_ID
            )
        )
    })

    it('should expose a null fee when the payload carries fee null', () => {
        const quote = Quote.fromJSON(
            srcToken,
            dstToken,
            signer,
            quoteDto({fee: null})
        )

        expect(quote.fee).toBeNull()
    })

    it('should parse a legacy payload without the fee field exactly as before', () => {
        const json = quoteDto()

        const quote = Quote.fromJSON(srcToken, dstToken, signer, json)

        const expectedPreset = new Preset(
            180,
            24,
            504,
            146964760n,
            146227772n,
            312195n,
            [{delay: 120, coefficient: 164}]
        )

        expect(quote.fee).toBeNull()
        expect(quote.quoteId).toEqual(json.quoteId)
        expect(quote.srcAmount).toEqual(1000000000n)
        expect(quote.dstAmount).toEqual(146964760n)
        expect(quote.recommendedPreset).toEqual('fast')
        expect(quote.priceImpactPercent).toEqual(0.405)
        expect(quote.presets.fast).toEqual(expectedPreset)
        expect(quote.presets.medium).toEqual(expectedPreset)
        expect(quote.presets.slow).toEqual(expectedPreset)
    })

    it('should build a fee-less order byte-identical to an order without a fee config', () => {
        const order = Quote.fromJSON(
            srcToken,
            dstToken,
            signer,
            quoteDto()
        ).toOrder()

        const expected = FusionOrder.new(
            {
                srcMint: srcToken,
                dstMint: dstToken,
                id: 424242,
                receiver: signer,
                srcAmount: 1000000000n,
                estimatedDstAmount: 146964760n,
                minDstAmount: 146227772n
            },
            new AuctionDetails({
                startTime: 1754820000 + 180,
                duration: 24,
                initialRateBump: 504,
                points: [{delay: 120, coefficient: 164}]
            })
        )

        expect(order.toJSON()).toEqual(expected.toJSON())
        expect(order.getOrderHashBase58()).toEqual(
            expected.getOrderHashBase58()
        )
    })

    it('should bake the Cache fee config into an SPL-destination order with the backend wire values', () => {
        const feeOrder = Quote.fromJSON(
            srcToken,
            dstToken,
            signer,
            quoteDto({fee: cacheFee})
        ).toOrder()
        const plainOrder = Quote.fromJSON(
            srcToken,
            dstToken,
            signer,
            quoteDto()
        ).toOrder()

        const json = feeOrder.toJSON()

        expect(json.fee).toEqual({
            protocolFee: 320,
            integratorFee: 480,
            surplusPercentage: 0,
            maxCancellationPremium: '1',
            protocolDstAta: getAta(
                new Address(protocolReceiver),
                dstToken,
                Address.TOKEN_PROGRAM_ID
            ).toString(),
            integratorDstAta: getAta(
                new Address(receiver),
                dstToken,
                Address.TOKEN_PROGRAM_ID
            ).toString()
        })
        expect(json.fee.protocolDstAta).toEqual(
            '7o5NcQeXqhy2Jg5mtxnf4fHhdTrV3KwL7v3EhXpaYmNg'
        )
        expect(json.fee.integratorDstAta).toEqual(
            '92vZyDx2g61nb2V2piPhqiG9Kk9pZ6sQfiyktCrfg5sV'
        )
        expect({...json, fee: plainOrder.toJSON().fee}).toEqual(
            plainOrder.toJSON()
        )
    })

    it('should pay fee receivers directly for a native-SOL destination', () => {
        const quote = Quote.fromJSON(
            dstToken,
            Address.NATIVE,
            signer,
            quoteDto({fee: cacheFee})
        )

        const json = quote.toOrder().toJSON()

        expect(json.dstMint).toEqual(Address.WRAPPED_NATIVE.toString())
        expect(json.fee.protocolDstAta).toEqual(protocolReceiver)
        expect(json.fee.integratorDstAta).toEqual(receiver)
        expect(quote.getFeeAtaCreateInstructions()).toEqual([])
    })

    it('should derive idempotent create instructions for both fee atas of an SPL destination', () => {
        const quote = Quote.fromJSON(
            srcToken,
            dstToken,
            signer,
            quoteDto({fee: cacheFee})
        )

        const instructions = quote.getFeeAtaCreateInstructions()

        expect(instructions).toHaveLength(2)
        expect(
            instructions.map((instruction) => ({
                payer: instruction.payer,
                owner: instruction.owner,
                mint: instruction.mint,
                tokenProgramId: instruction.tokenProgramId
            }))
        ).toEqual([
            {
                payer: signer,
                owner: new Address(receiver),
                mint: dstToken,
                tokenProgramId: Address.TOKEN_PROGRAM_ID
            },
            {
                payer: signer,
                owner: new Address(protocolReceiver),
                mint: dstToken,
                tokenProgramId: Address.TOKEN_PROGRAM_ID
            }
        ])
    })

    it('should derive a single create instruction when only the protocol fee applies', () => {
        const quote = Quote.fromJSON(
            srcToken,
            dstToken,
            signer,
            quoteDto({
                fee: {...cacheFee, integratorFeeBps: 0, receiver: null}
            })
        )

        const instructions = quote.getFeeAtaCreateInstructions()

        expect(instructions).toHaveLength(1)
        expect(instructions[0].owner).toEqual(new Address(protocolReceiver))
    })

    it('should derive fee atas with the token-2022 program when the destination mint uses it', () => {
        const quote = Quote.fromJSON(
            srcToken,
            dstToken,
            signer,
            quoteDto({
                fee: {
                    ...cacheFee,
                    dstTokenProgram: Address.TOKEN_2022_PROGRAM_ID.toString()
                }
            })
        )

        const json = quote.toOrder().toJSON()

        expect(json.fee.protocolDstAta).toEqual(
            getAta(
                new Address(protocolReceiver),
                dstToken,
                Address.TOKEN_2022_PROGRAM_ID
            ).toString()
        )
        expect(json.fee.integratorDstAta).toEqual(
            getAta(
                new Address(receiver),
                dstToken,
                Address.TOKEN_2022_PROGRAM_ID
            ).toString()
        )
        expect(
            quote
                .getFeeAtaCreateInstructions()
                .map((instruction) => instruction.tokenProgramId)
        ).toEqual([
            Address.TOKEN_2022_PROGRAM_ID,
            Address.TOKEN_2022_PROGRAM_ID
        ])
    })

    it('should need no fee ata create instructions for a fee-less quote', () => {
        const quote = Quote.fromJSON(srcToken, dstToken, signer, quoteDto())

        expect(quote.getFeeAtaCreateInstructions()).toEqual([])
    })

    function quoteDto(overrides: Partial<QuoteDTO> = {}): QuoteDTO {
        const preset = {
            startAuctionIn: 180,
            auctionDuration: 24,
            initialRateBump: 504,
            auctionStartAmount: '146964760',
            auctionEndAmount: '146227772',
            costInDstToken: '312195',
            points: [{delay: 120, coefficient: 164}]
        }

        return {
            quoteId: 'faf4062d-100a-4171-9ee3-685741404a5e',
            srcAmount: '1000000000',
            dstAmount: '146964760',
            presets: {fast: preset, medium: preset, slow: preset},
            recommendedPreset: 'fast',
            prices: {usd: {srcToken: '147.83', dstToken: '0.99'}},
            volume: {usd: {srcToken: '147.84', dstToken: '147.24'}},
            priceImpactPercent: 0.405,
            ...overrides
        }
    }
})
