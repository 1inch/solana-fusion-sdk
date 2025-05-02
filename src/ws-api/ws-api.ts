import {RpcWebsocketApi} from './rpc-websocket-api'
import {ActiveOrdersWebSocketApi} from './active-websocket-orders-api'
import {castUrl} from './url'
import {
    AnyFunction,
    AnyFunctionWithThis,
    ErrorFunctionWithThis,
    NetworkEnum,
    OnMessageCb,
    WebSocketEvent,
    WsApiConfig
} from './types'
import {WsProviderConnector} from './websocket-provider.connector'
import {WebsocketClient} from './websocket-client.connector'

export class WebSocketApi {
    private static Version = 'v1.0'

    public readonly rpc: RpcWebsocketApi

    public readonly order: ActiveOrdersWebSocketApi

    public readonly provider: WsProviderConnector

    private constructor(
        configOrProvider: WsApiConfig | WsProviderConnector,
        isConfig: boolean
    ) {
        if (isConfig) {
            const url = castUrl((configOrProvider as WsApiConfig).url)
            const urlWithNetwork = `${url}/${WebSocketApi.Version}/${NetworkEnum.SOLANA}`
            const configWithUrl = {...configOrProvider, url: urlWithNetwork}
            const provider = new WebsocketClient(configWithUrl)

            this.provider = provider
            this.rpc = new RpcWebsocketApi(provider)
            this.order = new ActiveOrdersWebSocketApi(provider)

            return
        }

        this.provider = configOrProvider as WsProviderConnector
        this.rpc = new RpcWebsocketApi(configOrProvider as WsProviderConnector)
        this.order = new ActiveOrdersWebSocketApi(
            configOrProvider as WsProviderConnector
        )
    }

    static fromConfig(config: WsApiConfig): WebSocketApi {
        return new WebSocketApi(config, true)
    }

    static fromProvider(provider: WsProviderConnector): WebSocketApi {
        return new WebSocketApi(provider, false)
    }

    init(): void {
        this.provider.init()
    }

    on(event: WebSocketEvent.Error, cb: ErrorFunctionWithThis): void

    on(event: WebSocketEvent, cb: AnyFunctionWithThis): void

    on(
        event: WebSocketEvent,
        cb: AnyFunctionWithThis | ErrorFunctionWithThis
    ): void {
        this.provider.on(event, cb)
    }

    off(event: WebSocketEvent.Error, cb: ErrorFunctionWithThis): void

    off(event: WebSocketEvent, cb: AnyFunctionWithThis): void

    off(
        event: WebSocketEvent,
        cb: AnyFunctionWithThis | ErrorFunctionWithThis
    ): void {
        this.provider.off(event, cb)
    }

    onOpen(cb: AnyFunctionWithThis): void {
        this.provider.onOpen(cb)
    }

    send<T>(message: T): void {
        this.provider.send(message)
    }

    close(): void {
        this.provider.close()
    }

    onMessage(cb: OnMessageCb): void {
        this.provider.onMessage(cb)
    }

    onClose(cb: AnyFunction): void {
        this.provider.onClose(cb)
    }

    onError(cb: AnyFunction): void {
        this.provider.onError(cb)
    }
}
