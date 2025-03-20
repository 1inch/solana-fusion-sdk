import {Jsonify} from 'type-fest'
import WebSocket from 'ws'
import {FusionOrder} from '../fusion-order'

export type RpcEvent<T extends RpcMethod, K> = {
    method: T
    result: K
}

export type ActiveOrder = {
    orderHash: string
    order: Jsonify<FusionOrder>
    txSignature: string
    maker: string
    remainingMakerAmount: string
}

export enum RpcMethod {
    GetAllowedMethods = 'getAllowedMethods',
    GetActiveOrders = 'getActiveOrders',
    Ping = 'ping'
}

export type GetAllowMethodsRpcEvent = RpcEvent<
    RpcMethod.GetAllowedMethods,
    RpcMethod[]
>

export type PaginationMeta = {
    totalItems: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
}

export type PaginationOutput<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends Record<string, any> = Record<string, any>
> = {
    meta: PaginationMeta
    items: T[]
}

export type GetActiveOrdersRpcEvent = RpcEvent<
    RpcMethod.GetActiveOrders,
    PaginationOutput<ActiveOrder>
>

export enum EventType {
    Create = 'create',
    Fill = 'fill',
    Cancel = 'cancel'
}

export type Event<K extends string, T> = {
    event: K
    result: T
}

export type OrderEventPayload = {
    transactionSignature: string
    slotNumber: number
    blockTime: number
    action: string
    commitment: string
    orderHash: string
    maker: string
    resolver: string | undefined
    order: Jsonify<FusionOrder> | undefined
    filledAuctionTakerAmount: string | undefined
    filledMakerAmount: string | undefined
}

export type OrderCreatedEvent = Event<EventType.Create, OrderEventPayload>

export type OrderFilledEvent = Event<EventType.Fill, OrderEventPayload>

export type OrderCancelledEvent = Event<EventType.Cancel, OrderEventPayload>

export type OrderEventType =
    | OrderCreatedEvent
    | OrderFilledEvent
    | OrderCancelledEvent

export type OnOrderCb = (data: OrderEventType) => any

export type OnOrderCreatedCb = (data: OrderCreatedEvent) => any

export type OnOrderFilledCb = (data: OrderFilledEvent) => any

export type OnOrderCancelledCb = (data: OrderCancelledEvent) => any

export enum WebSocketEvent {
    Close = 'close',
    Error = 'error',
    Message = 'message',
    Open = 'open'
}

export type RpcEventType = GetAllowMethodsRpcEvent | GetActiveOrdersRpcEvent

export type OnGetActiveOrdersCb = (
    data: GetActiveOrdersRpcEvent['result']
) => any

export type AnyFunction = (...args: any[]) => any

export type AnyFunctionWithThis = (this: WebSocket, ...args: any[]) => void

export type WsApiConfig = {
    url: string
    lazyInit?: boolean
    authKey?: string
}

export type OnMessageCb = (data: any) => void

export type OnMessageInputVoidCb = () => void

export type OnGetAllowedMethodsCb = (
    data: GetAllowMethodsRpcEvent['result']
) => any

export type OnPongCb = () => any

export type PaginationParams = {
    page?: number
    limit?: number
}

export class PaginationRequest {
    page: number | undefined

    limit: number | undefined

    constructor(page: number | undefined, limit: number | undefined) {
        this.page = page
        this.limit = limit
        this.validate()
    }

    private validate(): void {
        if (this.limit != null && (this.limit < 1 || this.limit > 500)) {
            throw new Error('limit should be in range between 1 and 500')
        }

        if (this.page != null && this.page < 1) {
            throw new Error(`page should be >= 1`)
        }
    }
}

export enum NetworkEnum {
    SOLANA = 501
}
