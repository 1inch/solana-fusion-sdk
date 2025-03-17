import {Jsonify} from 'type-fest'
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

export type GetAllowMethodsRpcEvent = RpcEvent<
    RpcMethod.GetAllowedMethods,
    RpcMethod[]
>

export enum RpcMethod {
    GetAllowedMethods = 'getAllowedMethods',
    GetActiveOrders = 'getActiveOrders'
}

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
    order: FusionOrder | undefined
    filledAuctionTakerAmount: string | undefined
    filledMakerAmount: string | undefined
}

export type OrderCreateEvent = Event<EventType.Create, OrderEventPayload>

export type OrderFillEvent = Event<EventType.Fill, OrderEventPayload>

export type OrderCancelEvent = Event<EventType.Cancel, OrderEventPayload>

export type OrderEventType =
    | OrderCreateEvent
    | OrderFillEvent
    | OrderCancelEvent
