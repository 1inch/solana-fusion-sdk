import {WebSocketApi} from './ws-api'
import {WebSocketEvent} from './types'
import {WsProviderConnector} from './websocket-provider.connector'

describe('WebSocketApi.fromProvider', () => {
    it('should delegate lifecycle methods to the injected provider', () => {
        const provider = {
            init: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            onOpen: jest.fn(),
            send: jest.fn(),
            close: jest.fn(),
            ping: jest.fn(),
            onPong: jest.fn(),
            onMessage: jest.fn(),
            onClose: jest.fn(),
            onError: jest.fn()
        } as unknown as WsProviderConnector
        const api = WebSocketApi.fromProvider(provider)
        const open = jest.fn()
        const close = jest.fn()
        const error = jest.fn()
        const message = jest.fn()

        api.init()
        api.onOpen(open)
        api.on(WebSocketEvent.Error, error)
        api.off(WebSocketEvent.Error, error)
        api.send({ping: true})
        api.onMessage(message)
        api.onClose(close)
        api.onError(error)
        api.close()

        expect(provider.init).toHaveBeenCalled()
        expect(provider.onOpen).toHaveBeenCalledWith(open)
        expect(provider.on).toHaveBeenCalledWith(WebSocketEvent.Error, error)
        expect(provider.off).toHaveBeenCalledWith(WebSocketEvent.Error, error)
        expect(provider.send).toHaveBeenCalledWith({ping: true})
        expect(provider.onMessage).toHaveBeenCalledWith(message)
        expect(provider.onClose).toHaveBeenCalledWith(close)
        expect(provider.onError).toHaveBeenCalledWith(error)
        expect(provider.close).toHaveBeenCalled()
        expect(api.provider).toBe(provider)
    })
})
