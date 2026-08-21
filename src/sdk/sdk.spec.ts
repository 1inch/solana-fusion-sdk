import {Sdk} from './sdk'
import {HttpProvider, QuoteDTO, QuoteFeeDTO} from '../api'
import {Address} from '../domains'

describe('Sdk', () => {
    const srcToken = new Address('So11111111111111111111111111111111111111112')
    const dstToken = new Address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
    const signer = new Address('GZctHpWXmsZC1YHACTGGcHhYxjdRqQvTpYkb9LMvxDib')
    const receiver = 'hf5iUqe8DAWpHfXhbhJ4rphgETAzjmeH5HGdjM7WSjp'
    const protocolReceiver = 'CckkBNtGaSb61k4y1uzG7WFgerhExf7b82Z8NU4ipFX4'

    const partnerFee: QuoteFeeDTO = {
        integratorFeeBps: 48,
        protocolFeeBps: 32,
        receiver,
        protocolReceiver,
        dstTokenProgram: Address.TOKEN_PROGRAM_ID.toString()
    }

    it('should reject createOrder for a fee-bearing SPL destination', async () => {
        const sdk = makeSdk(quoteDto({fee: partnerFee}))

        await expect(
            sdk.createOrder(srcToken, dstToken, 1_000_000_000n, signer)
        ).rejects.toThrow('Quote.getFeeAtaCreateInstructions()')
    })

    it('should create an order for a fee-bearing native-SOL destination', async () => {
        const sdk = makeSdk(quoteDto({fee: partnerFee}))

        const order = await sdk.createOrder(
            dstToken,
            Address.NATIVE,
            1_000_000_000n,
            signer
        )

        expect(order.toJSON().fee.protocolDstAta).toEqual(protocolReceiver)
        expect(order.toJSON().fee.integratorDstAta).toEqual(receiver)
    })

    it('should create an order for a fee-less quote', async () => {
        const sdk = makeSdk(quoteDto())

        const order = await sdk.createOrder(
            srcToken,
            dstToken,
            1_000_000_000n,
            signer
        )

        expect(order.toJSON().fee.protocolDstAta).toBeNull()
        expect(order.toJSON().fee.integratorDstAta).toBeNull()
    })

    function makeSdk(quote: QuoteDTO): Sdk {
        const provider = {
            get: jest.fn(async () => quote),
            post: jest.fn()
        } as unknown as HttpProvider

        return new Sdk(provider, {
            baseUrl: 'http://localhost',
            version: 'v1.0'
        })
    }

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
