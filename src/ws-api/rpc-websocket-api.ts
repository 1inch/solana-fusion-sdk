import {
    OnGetActiveOrdersCb,
    OnGetAllowedMethodsCb,
    OnPongCb,
    PaginationParams,
    PaginationRequest,
    RpcEventType,
    RpcMethod
} from './types'
import {WsProviderConnector} from './websocket-provider.connector'

export class RpcWebsocketApi {
    public readonly provider: WsProviderConnector

    constructor(provider: WsProviderConnector) {
        this.provider = provider
    }

    onPong(cb: OnPongCb): void {
        this.provider.onPong(() => {
            cb()
        })
    }

    ping(): void {
        this.provider.ping()
    }

    getActiveOrders({limit, page}: PaginationParams = {}): void {
        const paginationRequest = new PaginationRequest(page, limit)

        this.provider.send({
            method: RpcMethod.GetActiveOrders,
            param: paginationRequest
        })
    }

    onGetActiveOrders(cb: OnGetActiveOrdersCb): void {
        this.provider.onMessage((data: RpcEventType) => {
            if (data.method === RpcMethod.GetActiveOrders) {
                cb(data.result)
            }
        })
    }

    getAllowedMethods(): void {
        this.provider.send({method: RpcMethod.GetAllowedMethods})
    }

    onGetAllowedMethods(cb: OnGetAllowedMethodsCb): void {
        this.provider.onMessage((data: RpcEventType) => {
            if (data.method === RpcMethod.GetAllowedMethods) {
                cb(data.result)
            }
        })
    }
}
