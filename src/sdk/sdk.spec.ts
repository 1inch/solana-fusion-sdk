import {Sdk} from './sdk'
import {OrderStatus} from './order-status'
import {ActiveOrder} from './active-order'
import {CancellableOrder} from './cancellable-order'
import {Quote} from './quote'
import {
    HttpProvider,
    OrderStatus as OrderStatusEnum,
    QuoteDTO,
    QuoteFeeDTO
} from '../api'
import {Address, Bps} from '../domains'
import {AuctionDetails, FusionOrder} from '../fusion-order'
import {now} from '../utils'

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

    it('should wrap a quote payload and forward slippage', async () => {
        const quotePayload = quoteDto()
        const get = jest.fn(async (_url: string) => quotePayload)
        const sdk = new Sdk({get, post: jest.fn()} as unknown as HttpProvider, {
            baseUrl: 'http://localhost',
            version: 'v1.0'
        })

        const quote = await sdk.getQuote(
            srcToken,
            dstToken,
            1_000_000_000n,
            signer,
            Bps.fromPercent(1)
        )

        expect(quote).toBeInstanceOf(Quote)
        expect(quote.quoteId).toBe(quotePayload.quoteId)
        expect(get.mock.calls[0][0]).toContain('slippage=1')
        expect(get.mock.calls[0][0]).toContain('enableEstimate=true')
    })

    it('should wrap order status, active and cancelable listings', async () => {
        const orderJson = sampleOrder().toJSON()
        const statusPayload = {
            maker: signer.toString(),
            orderHash: 'hash-1',
            status: OrderStatusEnum.inProgress,
            order: orderJson,
            approximateTakingAmount: '1000',
            expirationTime: 1_700_000_180,
            fills: [
                {
                    txSignature: 'sig-fill',
                    filledMakerAmount: '10',
                    filledAuctionTakerAmount: '20'
                }
            ],
            createdAt: 1_700_000_000,
            srcTokenPriceUsd: 1,
            dstTokenPriceUsd: 2,
            cancelable: true
        }
        const listing = {
            meta: {
                totalItems: 1,
                itemsPerPage: 100,
                totalPages: 1,
                currentPage: 1
            },
            items: [
                {
                    orderHash: 'hash-1',
                    txSignature: 'sig-create',
                    maker: signer.toString(),
                    order: orderJson,
                    remainingMakerAmount: '500'
                }
            ]
        }
        const get = jest.fn(async (url: string) => {
            if (url.includes('/order/status/')) {
                return statusPayload
            }

            return listing
        })
        const sdk = new Sdk({get, post: jest.fn()} as unknown as HttpProvider, {
            baseUrl: 'http://localhost',
            version: 'v1.0'
        })

        const status = await sdk.getOrderStatus('hash-1')
        const active = await sdk.getActiveOrders(1, 50)
        const cancelable = await sdk.getOrdersCancellableByResolver()

        expect(status).toBeInstanceOf(OrderStatus)
        expect(status.isActive()).toBe(true)
        expect(status.orderHash).toBe('hash-1')
        expect(status.fills[0].filledMakerAmount).toBe(10n)
        expect(active.items[0]).toBeInstanceOf(ActiveOrder)
        expect(active.items[0].remainingMakerAmount).toBe(500n)
        expect(cancelable.items[0]).toBeInstanceOf(CancellableOrder)
        expect(cancelable.items[0].maker.equal(signer)).toBe(true)
        expect(get.mock.calls[1][0]).toContain('limit=50')
    })

    function sampleOrder(): FusionOrder {
        return FusionOrder.new(
            {
                srcMint: srcToken,
                dstMint: dstToken,
                srcAmount: 1000n,
                minDstAmount: 2000n,
                estimatedDstAmount: 2000n,
                id: 1,
                receiver: signer
            },
            AuctionDetails.noAuction(now(), 180)
        )
    }

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
