import {
    AnyFunction,
    AnyFunctionWithThis,
    OnMessageCb,
    OnMessageInputVoidCb
} from './types'

export abstract class WsProviderConnector {
    abstract init(): void

    abstract on(event: string, cb: AnyFunctionWithThis): void

    abstract off(event: string, cb: AnyFunctionWithThis): void

    abstract onOpen(cb: AnyFunctionWithThis): void

    abstract send<T>(message: T): void

    abstract close(): void

    abstract ping(): void

    abstract onPong(cb: OnMessageInputVoidCb): void

    abstract onMessage(cb: OnMessageCb): void

    abstract onClose(cb: AnyFunction): void

    abstract onError(cb: AnyFunction): void
}
