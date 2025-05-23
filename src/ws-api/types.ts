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

export type CreateOrderEventPayload = {
    transactionSignature: string
    slotNumber: number
    blockTime: number
    action: string
    commitment: string
    orderHash: string
    maker: string
    order: Jsonify<FusionOrder>
    filledAuctionTakerAmount: string
    filledMakerAmount: string
}

export type FillOrderEventPayload = {
    transactionSignature: string
    slotNumber: number
    blockTime: number
    action: string
    commitment: string
    orderHash: string
    maker: string
    resolver: string
    filledAuctionTakerAmount: string
    filledMakerAmount: string
}
export type CancelOrderEventPayload = {
    transactionSignature: string
    slotNumber: number
    blockTime: number
    action: string
    commitment: string
    orderHash: string
    maker: string
    filledAuctionTakerAmount: string
    filledMakerAmount: string
}

export type OrderCreatedEvent = Event<EventType.Create, CreateOrderEventPayload>

export type OrderFilledEvent = Event<EventType.Fill, FillOrderEventPayload>

export type OrderCancelledEvent = Event<
    EventType.Cancel,
    CancelOrderEventPayload
>

export type OrderEventType =
    | OrderCreatedEvent
    | OrderFilledEvent
    | OrderCancelledEvent

export type OnOrderCb = (data: OrderEventType) => unknown

export type OnOrderCreatedCb = (data: OrderCreatedEvent) => unknown

export type OnOrderFilledCb = (data: OrderFilledEvent) => unknown

export type OnOrderCancelledCb = (data: OrderCancelledEvent) => unknown

export enum WebSocketEvent {
    Close = 'close',
    Error = 'error',
    Message = 'message',
    Open = 'open'
}

export type RpcEventType = GetAllowMethodsRpcEvent | GetActiveOrdersRpcEvent

export type OnGetActiveOrdersCb = (
    data: GetActiveOrdersRpcEvent['result']
) => unknown

export type AnyFunction = (...args: unknown[]) => unknown

export type AnyFunctionWithThis = (this: WebSocket, ...args: unknown[]) => void
export type ErrorFunctionWithThis = (this: WebSocket, error: Error) => void

export type WsApiConfig = {
    url: string
    lazyInit?: boolean
    authKey?: string
}

export type OnMessageCb = (data: unknown) => void

export type OnMessageInputVoidCb = () => void

export type OnGetAllowedMethodsCb = (
    data: GetAllowMethodsRpcEvent['result']
) => unknown

export type OnPongCb = () => unknown

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
