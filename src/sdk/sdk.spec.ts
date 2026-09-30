import {Sdk} from './sdk'
import {OrderStatus} from './order-status'
import {ActiveOrder} from './active-order'
import {CancellableOrder} from './cancellable-order'
import {Quote} from './quote'
import {
    HttpProvider,
    OrderDTO,
    OrderInfoDTO,
    OrderStatus as OrderStatusEnum,
    OrderStatusDTO,
    Pagination,
    QuoteDTO,
    QuoteFeeDTO
} from '../api'
import {Address, Bps} from '../domains'

type WireOrder = Omit<OrderDTO, 'fee'> & {
    fee: Omit<OrderDTO['fee'], 'protocolDstAta' | 'integratorDstAta'> & {
        protocolDstAta: string | null
        integratorDstAta: string | null
    }
}

type WireOrderInfo = Omit<OrderInfoDTO, 'order'> & {order: WireOrder}

type WireOrderStatus = Omit<
    OrderStatusDTO,
    'order' | 'cancelTx' | 'srcTokenPriceUsd' | 'dstTokenPriceUsd'
> & {
    order: WireOrder
    cancelTx: string | null
    srcTokenPriceUsd: string
    dstTokenPriceUsd: string
}

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

    describe('orders API responses', () => {
        it('should compute the same order hash as the orders API for every listed order', async () => {
            const listing = cancelableListingResponse()
            const sdk = makeOrdersSdk(async () => listing)

            const cancelable = await sdk.getOrdersCancellableByResolver()

            expect(cancelable.meta).toEqual(listing.meta)
            expect(
                cancelable.items.map((o) => o.order.getOrderHashBase58())
            ).toEqual(listing.items.map((o) => o.orderHash))
        })

        it('should parse a listed order with a multi-point auction and no fees', async () => {
            const [raw] = cancelableListingResponse().items
            const sdk = makeOrdersSdk(async () => cancelableListingResponse())

            const [item] = (await sdk.getOrdersCancellableByResolver()).items

            expect(item).toBeInstanceOf(CancellableOrder)
            expect(item.maker.toString()).toBe(raw.maker)
            expect(item.order.srcAmount).toBe(1513878834710983n)
            expect(item.order.minDstAmount).toBe(22800324981298n)
            expect(item.order.deadline).toBe(raw.order.expirationTime)
            expect(item.order.auctionStartTime).toBe(1757501460)
            expect(item.order.auctionDetails.points).toHaveLength(7)
            expect(item.order.auctionDetails.points[0]).toEqual({
                coefficient: 4257,
                delay: 48
            })
            expect(item.order.fees).toBeNull()
            expect(
                item.order.resolverCancellationConfig?.maxCancellationPremium
            ).toBe(1n)
        })

        it('should parse active orders and request the given page', async () => {
            const [raw] = cancelableListingResponse().items
            const get = jest.fn(async (_url: string) =>
                cancelableListingResponse()
            )
            const sdk = makeOrdersSdk(get)

            const active = await sdk.getActiveOrders(2, 50)

            expect(get.mock.calls[0][0]).toContain('limit=50&page=2')
            expect(active.items[0]).toBeInstanceOf(ActiveOrder)
            expect(active.items[0].creationTxSignature).toBe(raw.txSignature)
            expect(active.items[0].remainingMakerAmount).toBe(20000000n)
            expect(active.items[0].order.getOrderHashBase58()).toBe(
                raw.orderHash
            )
        })

        it('should parse an in-progress order status', async () => {
            const raw = orderStatusResponse()
            const get = jest.fn(async (_url: string) => raw)
            const sdk = makeOrdersSdk(get)

            const status = await sdk.getOrderStatus(raw.orderHash)

            expect(get.mock.calls[0][0]).toContain(
                `/order/status/${raw.orderHash}`
            )
            expect(status).toBeInstanceOf(OrderStatus)
            expect(status.isActive()).toBe(true)
            expect(status.maker.toString()).toBe(raw.maker)
            expect(status.approximateTakingAmount).toBe(4138930n)
            expect(status.cancelable).toBe(true)
            expect(status.fills).toEqual([])
            expect(status.order.getOrderHashBase58()).toBe(raw.orderHash)
            expect(status.order.auctionDetails.points).toEqual([])
        })

        it('should parse fills of a filled order status', async () => {
            const sdk = makeOrdersSdk(async () => ({
                ...orderStatusResponse(),
                status: OrderStatusEnum.filled,
                approximateTakingAmount: '1096143',
                fills: [
                    {
                        txSignature:
                            '41EYz9L7196ZYPY9V61u33Dhp6dpg7nY1pVexbxBs36xCQLo1fnxvFMBBpjXnkg3ETrz1jnjLPWYvzpu8xDkP39K',
                        filledMakerAmount: '4138930',
                        filledAuctionTakerAmount: '1096143'
                    }
                ]
            }))

            const status = await sdk.getOrderStatus('ignored')

            expect(status.isActive()).toBe(false)
            expect(status.fills).toEqual([
                {
                    txSignature:
                        '41EYz9L7196ZYPY9V61u33Dhp6dpg7nY1pVexbxBs36xCQLo1fnxvFMBBpjXnkg3ETrz1jnjLPWYvzpu8xDkP39K',
                    filledMakerAmount: 4138930n,
                    filledAuctionTakerAmount: 1096143n
                }
            ])
        })

        it('should propagate a failed orders API request', async () => {
            const error = new Error('Request failed with status code 404')
            const sdk = makeOrdersSdk(async () => {
                throw error
            })

            await expect(sdk.getOrderStatus('missing')).rejects.toBe(error)
            await expect(sdk.getActiveOrders()).rejects.toBe(error)
            await expect(sdk.getOrdersCancellableByResolver()).rejects.toBe(
                error
            )
        })
    })

    function makeOrdersSdk(get: (url: string) => Promise<unknown>): Sdk {
        return new Sdk({get, post: jest.fn()} as unknown as HttpProvider, {
            baseUrl: 'http://localhost',
            version: 'v1.0'
        })
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

    function cancelableListingResponse(): Pagination<WireOrderInfo> {
        return {
            items: [
                {
                    orderHash: 'FHLohFSxVQwNbqvU98RwiRqgJbGJTFUFnsvXssnSbtAq',
                    txSignature:
                        '4CGujBopoN4HCDzMtntCAAAdQGCveqrKdnCMAQpGiT3b6YK4qQYLn1xyn5NMn2R3GsDWQW8VrXX2ZsHdo99z6DNx',
                    maker: 'DtChAkd6wxZRpD8go62wc5sp2ajPr1aeD9dyswmaG3nX',
                    order: {
                        id: 2742055262,
                        fee: {
                            protocolFee: 0,
                            integratorFee: 0,
                            protocolDstAta: null,
                            integratorDstAta: null,
                            surplusPercentage: 0,
                            maxCancellationPremium: '1'
                        },
                        dstMint: 'pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn',
                        srcMint: 'Ey59PH7Z4BFU4HjyKnyMdWt5GGN76KazTAwQihoUXRnk',
                        receiver:
                            'DtChAkd6wxZRpD8go62wc5sp2ajPr1aeD9dyswmaG3nX',
                        srcAmount: '1513878834710983',
                        minDstAmount: '22800324981298',
                        expirationTime: 1757501496,
                        dstAssetIsNative: false,
                        dutchAuctionData: {
                            duration: 24,
                            startTime: 1757501460,
                            initialRateBump: 5115,
                            pointsAndTimeDeltas: [
                                {rateBump: 4257, timeDelta: 48},
                                {rateBump: 3367, timeDelta: 48},
                                {rateBump: 2407, timeDelta: 48},
                                {rateBump: 1419, timeDelta: 48},
                                {rateBump: 503, timeDelta: 48},
                                {rateBump: 502, timeDelta: 24},
                                {rateBump: 501, timeDelta: 60}
                            ]
                        },
                        srcAssetIsNative: false,
                        estimatedDstAmount: '22800324981298',
                        cancellationAuctionDuration: 1
                    },
                    remainingMakerAmount: '20000000'
                },
                {
                    orderHash: '9EcYNLAJW4GnxME67YF8dh4Ephyw3Vijq17QVHZY4Eyk',
                    txSignature:
                        '2pntnKx7ePHVnHFdtWHLynzBWZmiLkhPvXir5hQmZFoacshVf2Weyf9K1zTfLJHGi4z5HvRPps5Kg6WPbppnJxCv',
                    maker: '2XmAmDytGvrZ1uRFbExGhRCeEWs7kA5GYCTpPgJL9gmL',
                    order: orderStatusResponse().order,
                    remainingMakerAmount: '4138930'
                }
            ],
            meta: {
                totalItems: 9,
                currentPage: 1,
                itemsPerPage: 2,
                totalPages: 5
            }
        }
    }

    function orderStatusResponse(): WireOrderStatus {
        return {
            orderHash: '9EcYNLAJW4GnxME67YF8dh4Ephyw3Vijq17QVHZY4Eyk',
            maker: '2XmAmDytGvrZ1uRFbExGhRCeEWs7kA5GYCTpPgJL9gmL',
            expirationTime: 1759326056000,
            createdAt: 1759325865693,
            srcTokenPriceUsd: '0.3607247',
            dstTokenPriceUsd: '0.99955401',
            fills: [],
            approximateTakingAmount: '4138930',
            cancelTx: null,
            status: OrderStatusEnum.inProgress,
            order: {
                id: 3037445812,
                srcAmount: '4138930',
                minDstAmount: '1096143',
                estimatedDstAmount: '1096143',
                expirationTime: 1759326056,
                receiver: '2XmAmDytGvrZ1uRFbExGhRCeEWs7kA5GYCTpPgJL9gmL',
                srcAssetIsNative: false,
                dstAssetIsNative: false,
                cancellationAuctionDuration: 1,
                fee: {
                    protocolFee: 0,
                    integratorFee: 0,
                    surplusPercentage: 0,
                    protocolDstAta: null,
                    integratorDstAta: null,
                    maxCancellationPremium: '1'
                },
                dutchAuctionData: {
                    startTime: 1759326020,
                    duration: 24,
                    initialRateBump: 7201,
                    pointsAndTimeDeltas: []
                },
                srcMint: 'E2gLkTXSbbTMmJM19xkquawun2ShJSi7G59A8c2PtbFa',
                dstMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
            },
            cancelable: true
        }
    }
})
