import {WebSocket, WebSocketServer} from 'ws'
import {WebSocketApi} from './ws-api'
import {
    EventType,
    GetActiveOrdersRpcEvent,
    GetAllowMethodsRpcEvent,
    OrderCancelledEvent,
    OrderCreatedEvent,
    OrderEventType,
    OrderFilledEvent,
    RpcMethod,
    WebSocketEvent
} from './types'
import {castUrl} from './url'
import {WebsocketClient} from './websocket-client.connector'

jest.setTimeout(5 * 60 * 1000)

describe(__filename, () => {
    describe('base', () => {
        it('should be possible to subscribe to message', (done) => {
            const message = {id: 1}
            const {wss, url} = createWebsocketServerMock([message])

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            wsSdk.onMessage((data) => {
                expect(data).toEqual(message)
                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('should be possible to subscribe to open connection', (done) => {
            const message = {id: 1}
            const {wss, url} = createWebsocketServerMock([message])

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            wsSdk.onOpen(() => {
                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('this is pointed to underlying websocket', (done) => {
            const message = {id: 1}
            const {wss, url} = createWebsocketServerMock([message])

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            wsSdk.on(WebSocketEvent.Open, function (this: WebSocket) {
                expect(this).toBeInstanceOf(WebSocket)
                this.close()
                wss.close()
                done()
            })
        })

        // TODO repair waiting a lot of time ....
        xit('should be possible to subscribe to error', (done) => {
            const wsSdk = WebSocketApi.createFromConfig({
                url: 'ws://localhost:2345'
            })

            wsSdk.on(WebSocketEvent.Error, (error) => {
                expect(error.message).toContain('ECONNREFUSED')
                wsSdk.close()
                done()
            })
        })

        it('should be possible to initialize in lazy mode', (done) => {
            const message = {id: 1}
            const port = 8080

            const url = `ws://localhost:${port}/websocket`
            const wss = new WebSocketServer({port, path: '/websocket/v1.0/501'})

            wss.on('connection', (ws: WebSocket) => {
                for (const m of [message]) {
                    ws.send(JSON.stringify(m))
                }
            })

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                lazyInit: true,
                authKey: ''
            })

            expect(wsSdk.provider).toMatchObject({initialized: false})

            wsSdk.init()

            expect(wsSdk.provider).toMatchObject({initialized: true})

            wsSdk.onMessage((data) => {
                expect(data).toEqual(message)

                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('should be safe to call methods on uninitialized ws', () => {
            const wsSdk = WebSocketApi.createFromConfig({
                url: 'random',
                lazyInit: true
            })

            expect(() => wsSdk.send({id: 1})).toThrowError()
        })

        it('should be possible to initialize not in lazy mode', (done) => {
            const message = {id: 1}
            const port = 8080

            const url = `ws://localhost:${port}/websocket`
            const wss = new WebSocketServer({port, path: '/websocket/v1.0/501'})

            wss.on('connection', (ws: WebSocket) => {
                for (const m of [message]) {
                    ws.send(JSON.stringify(m))
                }
            })

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                lazyInit: false
            })

            expect(wsSdk).toBeDefined()

            wsSdk.onMessage((data) => {
                expect(data).toEqual(message)

                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('should be possible to pass provider instead of config', (done) => {
            const message = {id: 1}
            const port = 8080

            const url = `ws://localhost:${port}/websocket`
            const wss = new WebSocketServer({port, path: '/websocket/v1.0/501'})

            wss.on('connection', (ws: WebSocket) => {
                for (const m of [message]) {
                    ws.send(JSON.stringify(m))
                }
            })

            const castedUrl = castUrl(url)
            const urlWithNetwork = `${castedUrl}/v1.0/501`
            const provider = new WebsocketClient({url: urlWithNetwork})

            const wsSdk = WebSocketApi.createFromProvider(provider)

            expect(wsSdk.rpc).toBeDefined()
            expect(wsSdk.order).toBeDefined()

            expect(wsSdk).toBeDefined()

            wsSdk.onMessage((data) => {
                expect(data).toEqual(message)

                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('connection can be closed and you can listen to close event', (done) => {
            const message = {id: 1}
            const {wss, url} = createWebsocketServerMock([message])

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            wsSdk.onClose(() => {
                wss.close()
                done()
            })

            wsSdk.onOpen(() => {
                wsSdk.close()
            })
        })
    })

    describe('rpc', () => {
        it('can ping pong ', (done) => {
            const {url, wss} = createWebsocketRpcServerMock((_ws, _data) => {})

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            wsSdk.onOpen(() => {
                wsSdk.rpc.ping()
            })

            let isDone = false
            wsSdk.rpc.onPong(() => {
                if (isDone) {
                    return
                }

                isDone = true
                expect(true).toEqual(true)
                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('can retrieve allowed rpc methods ', (done) => {
            const response: GetAllowMethodsRpcEvent = {
                method: RpcMethod.GetAllowedMethods,
                result: [
                    RpcMethod.Ping,
                    RpcMethod.GetAllowedMethods,
                    RpcMethod.GetActiveOrders
                ]
            }
            const {url, wss} = createWebsocketRpcServerMock((ws, data) => {
                const parsedData = JSON.parse(data)

                if (parsedData.method === RpcMethod.GetAllowedMethods) {
                    ws.send(JSON.stringify(response))
                }
            })

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            wsSdk.onOpen(() => {
                wsSdk.rpc.getAllowedMethods()
            })

            wsSdk.rpc.onGetAllowedMethods((data) => {
                expect(data).toEqual(response.result)
                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('getActiveOrders success', (done) => {
            const response: GetActiveOrdersRpcEvent = {
                method: RpcMethod.GetActiveOrders,
                result: {
                    items: [],
                    meta: {
                        totalItems: 0,
                        totalPages: 0,
                        itemsPerPage: 0,
                        currentPage: 0
                    }
                }
            }
            const {url, wss} = createWebsocketRpcServerMock((ws, data) => {
                const parsedData = JSON.parse(data)

                if (parsedData.method === RpcMethod.GetActiveOrders) {
                    ws.send(JSON.stringify(response))
                }
            })

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            wsSdk.onOpen(() => {
                wsSdk.rpc.getActiveOrders()
            })

            wsSdk.rpc.onGetActiveOrders((data) => {
                expect(data).toEqual(response.result)
                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('getActiveOrders throws error', (done) => {
            const response: GetActiveOrdersRpcEvent = {
                method: RpcMethod.GetActiveOrders,
                result: {
                    items: [],
                    meta: {
                        totalItems: 0,
                        totalPages: 0,
                        itemsPerPage: 0,
                        currentPage: 0
                    }
                }
            }
            const {url, wss} = createWebsocketRpcServerMock((ws, data) => {
                const parsedData = JSON.parse(data)

                if (parsedData.method === RpcMethod.GetActiveOrders) {
                    ws.send(JSON.stringify(response))
                }
            })

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            wsSdk.onOpen(() => {
                try {
                    wsSdk.rpc.getActiveOrders({page: -1})
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })
    })

    describe('order', () => {
        it('can subscribe to order events', (done) => {
            const message1: OrderCreatedEvent = {
                event: EventType.Create,
                result: {
                    transactionSignature:
                        '552R8GxcRyabBGr2inXi8v8VeByRvNghW4obXvXmbTJoy6sLdSNEwFVGcYjiZNpBL1CzqigR1bi31yPXxhq7f3Np',
                    slotNumber: 100500,
                    blockTime: 100500,
                    action: 'create',
                    commitment: 'finalized',
                    orderHash: 'Cd7Y1XCsqtd8JGcjecgHHatKtkqyEGkr1h4TCsur14Ki',
                    maker: '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                    resolver: '3k2mmTKz5oNDUv4n3TrxuvF5euYW2fZKHsk9frbQX8Ti',
                    order: {
                        id: 0,
                        fee: {
                            protocolFee: 0,
                            integratorFee: 0,
                            protocolDstAta: null,
                            integratorDstAta: null,
                            surplusPercentage: 0,
                            maxCancellationPremium: '1'
                        },
                        dstMint: 'So11111111111111111111111111111111111111112',
                        srcMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                        receiver:
                            '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                        srcAmount: '1200000',
                        minDstAmount: '6729670',
                        expirationTime: 1742228896,
                        nativeDstAsset: true,
                        nativeSrcAsset: false,
                        dutchAuctionData: {
                            duration: 24,
                            startTime: 1742228860,
                            initialRateBump: 7039,
                            pointsAndTimeDeltas: []
                        },
                        estimatedDstAmount: '6729670',
                        cancellationAuctionDuration: 1
                    },
                    filledAuctionTakerAmount: '12470402',
                    filledMakerAmount: '100000000'
                }
            }

            const messages = [message1, message1]
            const {url, wss} = createWebsocketServerMock(messages)

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            const resArray: OrderEventType[] = []
            wsSdk.order.onOrder((data) => {
                resArray.push(data)
            })

            wsSdk.onMessage(() => {
                if (resArray.length === 2) {
                    expect(resArray).toEqual(messages)
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })

        it('can subscribe to order created events', (done) => {
            const message1: OrderCreatedEvent = {
                event: EventType.Create,
                result: {
                    transactionSignature:
                        '552R8GxcRyabBGr2inXi8v8VeByRvNghW4obXvXmbTJoy6sLdSNEwFVGcYjiZNpBL1CzqigR1bi31yPXxhq7f3Np',
                    slotNumber: 100500,
                    blockTime: 100500,
                    action: 'create',
                    commitment: 'finalized',
                    orderHash: 'Cd7Y1XCsqtd8JGcjecgHHatKtkqyEGkr1h4TCsur14Ki',
                    maker: '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                    resolver: '3k2mmTKz5oNDUv4n3TrxuvF5euYW2fZKHsk9frbQX8Ti',
                    order: {
                        id: 0,
                        fee: {
                            protocolFee: 0,
                            integratorFee: 0,
                            protocolDstAta: null,
                            integratorDstAta: null,
                            surplusPercentage: 0,
                            maxCancellationPremium: '1'
                        },
                        dstMint: 'So11111111111111111111111111111111111111112',
                        srcMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                        receiver:
                            '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                        srcAmount: '1200000',
                        minDstAmount: '6729670',
                        expirationTime: 1742228896,
                        nativeDstAsset: true,
                        nativeSrcAsset: false,
                        dutchAuctionData: {
                            duration: 24,
                            startTime: 1742228860,
                            initialRateBump: 7039,
                            pointsAndTimeDeltas: []
                        },
                        estimatedDstAmount: '6729670',
                        cancellationAuctionDuration: 1
                    },
                    filledAuctionTakerAmount: '12470402',
                    filledMakerAmount: '100000000'
                }
            }

            const messages = [message1, message1]
            const expectedMessages = [message1, message1]
            const {url, wss} = createWebsocketServerMock(messages)

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            const resArray: OrderEventType[] = []
            wsSdk.order.onOrderCreated((data) => {
                resArray.push(data)
            })

            wsSdk.onMessage(() => {
                if (resArray.length === 2) {
                    expect(resArray).toEqual(expectedMessages)
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })

        it('can subscribe to order filled events', (done) => {
            const message1: OrderCreatedEvent = {
                event: EventType.Create,
                result: {
                    transactionSignature:
                        '552R8GxcRyabBGr2inXi8v8VeByRvNghW4obXvXmbTJoy6sLdSNEwFVGcYjiZNpBL1CzqigR1bi31yPXxhq7f3Np',
                    slotNumber: 100500,
                    blockTime: 100500,
                    action: 'create',
                    commitment: 'finalized',
                    orderHash: 'Cd7Y1XCsqtd8JGcjecgHHatKtkqyEGkr1h4TCsur14Ki',
                    maker: '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                    resolver: '3k2mmTKz5oNDUv4n3TrxuvF5euYW2fZKHsk9frbQX8Ti',
                    order: {
                        id: 0,
                        fee: {
                            protocolFee: 0,
                            integratorFee: 0,
                            protocolDstAta: null,
                            integratorDstAta: null,
                            surplusPercentage: 0,
                            maxCancellationPremium: '1'
                        },
                        dstMint: 'So11111111111111111111111111111111111111112',
                        srcMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                        receiver:
                            '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                        srcAmount: '1200000',
                        minDstAmount: '6729670',
                        expirationTime: 1742228896,
                        nativeDstAsset: true,
                        nativeSrcAsset: false,
                        dutchAuctionData: {
                            duration: 24,
                            startTime: 1742228860,
                            initialRateBump: 7039,
                            pointsAndTimeDeltas: []
                        },
                        estimatedDstAmount: '6729670',
                        cancellationAuctionDuration: 1
                    },
                    filledAuctionTakerAmount: '12470402',
                    filledMakerAmount: '100000000'
                }
            }

            const message2: OrderFilledEvent = {
                event: EventType.Fill,
                result: {
                    transactionSignature:
                        '552R8GxcRyabBGr2inXi8v8VeByRvNghW4obXvXmbTJoy6sLdSNEwFVGcYjiZNpBL1CzqigR1bi31yPXxhq7f3Np',
                    slotNumber: 100500,
                    blockTime: 100500,
                    action: 'fill',
                    commitment: 'finalized',
                    orderHash: 'Cd7Y1XCsqtd8JGcjecgHHatKtkqyEGkr1h4TCsur14Ki',
                    maker: '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                    resolver: '3k2mmTKz5oNDUv4n3TrxuvF5euYW2fZKHsk9frbQX8Ti',
                    order: {
                        id: 0,
                        fee: {
                            protocolFee: 0,
                            integratorFee: 0,
                            protocolDstAta: null,
                            integratorDstAta: null,
                            surplusPercentage: 0,
                            maxCancellationPremium: '1'
                        },
                        dstMint: 'So11111111111111111111111111111111111111112',
                        srcMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                        receiver:
                            '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                        srcAmount: '1200000',
                        minDstAmount: '6729670',
                        expirationTime: 1742228896,
                        nativeDstAsset: true,
                        nativeSrcAsset: false,
                        dutchAuctionData: {
                            duration: 24,
                            startTime: 1742228860,
                            initialRateBump: 7039,
                            pointsAndTimeDeltas: []
                        },
                        estimatedDstAmount: '6729670',
                        cancellationAuctionDuration: 1
                    },
                    filledAuctionTakerAmount: '12470402',
                    filledMakerAmount: '100000000'
                }
            }

            const messages = [message1, message1, message2]
            const expectedMessages = [message2]
            const {url, wss} = createWebsocketServerMock(messages)

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            const resArray: OrderEventType[] = []
            wsSdk.order.onOrderFilled((data) => {
                resArray.push(data)
            })

            wsSdk.onMessage(() => {
                if (resArray.length === 1) {
                    expect(resArray).toEqual(expectedMessages)
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })

        it('can subscribe to order cancelled events', (done) => {
            const message1: OrderCreatedEvent = {
                event: EventType.Create,
                result: {
                    transactionSignature:
                        '552R8GxcRyabBGr2inXi8v8VeByRvNghW4obXvXmbTJoy6sLdSNEwFVGcYjiZNpBL1CzqigR1bi31yPXxhq7f3Np',
                    slotNumber: 100500,
                    blockTime: 100500,
                    action: 'create',
                    commitment: 'finalized',
                    orderHash: 'Cd7Y1XCsqtd8JGcjecgHHatKtkqyEGkr1h4TCsur14Ki',
                    maker: '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                    resolver: '3k2mmTKz5oNDUv4n3TrxuvF5euYW2fZKHsk9frbQX8Ti',
                    order: {
                        id: 0,
                        fee: {
                            protocolFee: 0,
                            integratorFee: 0,
                            protocolDstAta: null,
                            integratorDstAta: null,
                            surplusPercentage: 0,
                            maxCancellationPremium: '1'
                        },
                        dstMint: 'So11111111111111111111111111111111111111112',
                        srcMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                        receiver:
                            '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                        srcAmount: '1200000',
                        minDstAmount: '6729670',
                        expirationTime: 1742228896,
                        nativeDstAsset: true,
                        nativeSrcAsset: false,
                        dutchAuctionData: {
                            duration: 24,
                            startTime: 1742228860,
                            initialRateBump: 7039,
                            pointsAndTimeDeltas: []
                        },
                        estimatedDstAmount: '6729670',
                        cancellationAuctionDuration: 1
                    },
                    filledAuctionTakerAmount: '12470402',
                    filledMakerAmount: '100000000'
                }
            }

            const message2: OrderCancelledEvent = {
                event: EventType.Cancel,
                result: {
                    transactionSignature:
                        '552R8GxcRyabBGr2inXi8v8VeByRvNghW4obXvXmbTJoy6sLdSNEwFVGcYjiZNpBL1CzqigR1bi31yPXxhq7f3Np',
                    slotNumber: 100500,
                    blockTime: 100500,
                    action: 'cancel',
                    commitment: 'finalized',
                    orderHash: 'Cd7Y1XCsqtd8JGcjecgHHatKtkqyEGkr1h4TCsur14Ki',
                    maker: '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                    resolver: '3k2mmTKz5oNDUv4n3TrxuvF5euYW2fZKHsk9frbQX8Ti',
                    order: {
                        id: 0,
                        fee: {
                            protocolFee: 0,
                            integratorFee: 0,
                            protocolDstAta: null,
                            integratorDstAta: null,
                            surplusPercentage: 0,
                            maxCancellationPremium: '1'
                        },
                        dstMint: 'So11111111111111111111111111111111111111112',
                        srcMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                        receiver:
                            '49HbHjsigfRLhWriKTse77Bw7UPaMN29dGCxM2BfgfVz',
                        srcAmount: '1200000',
                        minDstAmount: '6729670',
                        expirationTime: 1742228896,
                        nativeDstAsset: true,
                        nativeSrcAsset: false,
                        dutchAuctionData: {
                            duration: 24,
                            startTime: 1742228860,
                            initialRateBump: 7039,
                            pointsAndTimeDeltas: []
                        },
                        estimatedDstAmount: '6729670',
                        cancellationAuctionDuration: 1
                    },
                    filledAuctionTakerAmount: '12470402',
                    filledMakerAmount: '100000000'
                }
            }

            const messages = [message1, message1, message2]
            const expectedMessages = [message2]
            const {url, wss} = createWebsocketServerMock(messages)

            const wsSdk = WebSocketApi.createFromConfig({
                url,
                authKey: ''
            })

            const resArray: OrderEventType[] = []
            wsSdk.order.onOrderCancelled((data) => {
                resArray.push(data)
            })

            wsSdk.onMessage(() => {
                if (resArray.length === 1) {
                    expect(resArray).toEqual(expectedMessages)
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })
    })
})

function createWebsocketRpcServerMock(
    cb: (ws: WebSocket, result: any) => void
): {
    url: string
    wss: WebSocketServer
} {
    const port = 8080
    const returnUrl = `ws://localhost:${port}/websocket`
    const wss = new WebSocketServer({port, path: '/websocket/v1.0/501'})

    wss.on('connection', (ws: WebSocket) => {
        ws.on('message', (data: unknown) => cb(ws, data))
        ws.on('ping', () => {
            ws.pong()
        })
    })

    return {url: returnUrl, wss}
}

function createWebsocketServerMock(messages: any[]): {
    url: string
    wss: WebSocketServer
} {
    const port = 8080

    const returnUrl = `ws://localhost:${port}/websocket`
    const wss = new WebSocketServer({port, path: '/websocket/v1.0/501'})

    wss.on('connection', (ws: WebSocket) => {
        for (const message of messages) {
            ws.send(JSON.stringify(message))
        }
    })

    return {url: returnUrl, wss}
}
