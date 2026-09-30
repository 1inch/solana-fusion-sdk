import {WebsocketClient} from './websocket-client.connector'

const on = jest.fn()
const off = jest.fn()
const send = jest.fn()
const ping = jest.fn()
const close = jest.fn()

jest.mock('ws', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
            on,
            off,
            send,
            ping,
            close
        }))
    }
})

describe('WebsocketClient', () => {
    beforeEach(() => {
        on.mockReset()
        off.mockReset()
        send.mockReset()
        ping.mockReset()
        close.mockReset()
    })

    it('should reject init when the socket is already open', () => {
        const client = new WebsocketClient({url: 'wss://example'})

        expect(() => client.init()).toThrow('WebSocket is already initialized')
    })

    it('should reject send before lazy init', () => {
        const client = new WebsocketClient({
            url: 'wss://example',
            lazyInit: true
        })

        expect(() => client.send({a: 1})).toThrow(
            'WebSocket is not initialized. Call init() first.'
        )
    })

    it('should open a lazy socket with an auth header and parse messages', () => {
        const client = new WebsocketClient({
            url: 'wss://example',
            lazyInit: true,
            authKey: 'secret'
        })

        client.init()
        client.send({hello: true})
        client.ping()
        client.close()

        const messageHandler = (cb: (data: unknown) => void): void => {
            client.onMessage(cb)
            const registered = on.mock.calls.find(
                (call) => call[0] === 'message'
            )?.[1] as (data: unknown) => void

            registered(Buffer.from('{"ok":true}'))
            registered({unexpected: true})
        }
        const received: unknown[] = []
        const errorSpy = jest.spyOn(console, 'error').mockImplementation()

        messageHandler((data) => received.push(data))

        expect(received).toEqual([{ok: true}])
        expect(errorSpy).toHaveBeenCalled()
        expect(send).toHaveBeenCalledWith('{"hello":true}')
        expect(ping).toHaveBeenCalled()
        expect(close).toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    it('should wire open, pong, close and error listeners', () => {
        const client = new WebsocketClient({url: 'wss://example'})
        const cb = jest.fn()

        client.onOpen(cb)
        client.onPong(cb)
        client.onClose(cb)
        client.onError(cb)
        client.off('open', cb)

        expect(on).toHaveBeenCalledWith('open', cb)
        expect(on).toHaveBeenCalledWith('pong', expect.any(Function))
        expect(on).toHaveBeenCalledWith('close', cb)
        expect(on).toHaveBeenCalledWith('error', cb)
        expect(off).toHaveBeenCalledWith('open', cb)

        const pongWrapper = on.mock.calls.find(
            (call) => call[0] === 'pong'
        )?.[1] as () => void
        pongWrapper()
        expect(cb).toHaveBeenCalled()
    })
})
