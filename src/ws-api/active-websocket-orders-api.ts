import {orderEvents} from './constants'
import {
    EventType,
    OnOrderCancelledCb,
    OnOrderCb,
    OnOrderCreatedCb,
    OnOrderFilledCb,
    OrderEventType
} from './types'
import {WsProviderConnector} from './websocket-provider.connector'

export class ActiveOrdersWebSocketApi {
    public readonly provider!: WsProviderConnector

    constructor(provider: WsProviderConnector) {
        this.provider = provider
    }

    onOrder(cb: OnOrderCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (orderEvents.includes(data.event)) {
                cb(data)
            }
        })
    }

    onOrderCreated(cb: OnOrderCreatedCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.Create) {
                cb(data)
            }
        })
    }

    onOrderFilled(cb: OnOrderFilledCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.Fill) {
                cb(data)
            }
        })
    }

    onOrderCancelled(cb: OnOrderCancelledCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.Cancel) {
                cb(data)
            }
        })
    }
}
