import {OrderInfoDTO, OrderStatusDTO} from './types'
import {ApiConfig, HttpProvider, Pagination, Headers} from '../types'

export class OrdersApi {
    private readonly baseUrl: string

    private readonly headers: Headers

    constructor(
        private readonly httpClient: HttpProvider,
        config: ApiConfig
    ) {
        this.baseUrl = `${config.baseUrl}/orders/${config.version}/501`
        this.headers = config.authKey
            ? {
                  Authorization: `Bearer ${config.authKey}`
              }
            : {}
    }

    public async getActiveOrders(
        page = 1,
        limit = 100
    ): Promise<Pagination<OrderInfoDTO>> {
        return this.httpClient.get(
            `${this.baseUrl}/order/active?limit=${limit}&page=${page}`,
            this.headers
        )
    }

    public async getOrderStatus(orderHash: string): Promise<OrderStatusDTO> {
        return this.httpClient.get(
            `${this.baseUrl}/order/status/${orderHash}`,
            this.headers
        )
    }
}
