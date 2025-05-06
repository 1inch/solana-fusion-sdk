import {Quote} from './quote'
import {OrderStatus} from './order-status'
import {CancellableOrder} from './cancellable-order'
import {ActiveOrder} from './active-order'
import {FusionOrder} from '../fusion-order'
import {Address, Bps} from '../domains'
import {ApiConfig, HttpProvider, OrdersApi, Pagination, QuoterApi} from '../api'

export class Sdk {
    private readonly ordersApi: OrdersApi

    private readonly quoterApi: QuoterApi

    constructor(provider: HttpProvider, apiConfig: ApiConfig) {
        this.ordersApi = new OrdersApi(provider, apiConfig)
        this.quoterApi = new QuoterApi(provider, apiConfig)
    }

    public async getQuote(
        srcToken: Address,
        dstToken: Address,
        amount: bigint,
        signer: Address,
        slippage?: Bps
    ): Promise<Quote> {
        const quoteRaw = await this.quoterApi.getQuote(
            srcToken,
            dstToken,
            amount,
            signer,
            true,
            slippage
        )

        return Quote.fromJSON(srcToken, dstToken, signer, quoteRaw)
    }

    public async createOrder(
        srcToken: Address,
        dstToken: Address,
        amount: bigint,
        signer: Address,
        slippage?: Bps
    ): Promise<FusionOrder> {
        const quote = await this.getQuote(
            srcToken,
            dstToken,
            amount,
            signer,
            slippage
        )

        return quote.toOrder()
    }

    public async getOrderStatus(orderHash: string): Promise<OrderStatus> {
        const orderStatus = await this.ordersApi.getOrderStatus(orderHash)

        return OrderStatus.fromJSON(orderStatus)
    }

    public async getOrdersCancellableByResolver(
        page = 1,
        limit = 100
    ): Promise<Pagination<CancellableOrder>> {
        const res = await this.ordersApi.getOrdersCancellableByResolver(
            page,
            limit
        )

        return {
            ...res,
            items: res.items.map(
                (o) =>
                    new CancellableOrder(
                        new Address(o.maker),
                        FusionOrder.fromJSON(o.order)
                    )
            )
        }
    }

    public async getActiveOrders(
        page = 1,
        limit = 100
    ): Promise<Pagination<ActiveOrder>> {
        const res = await this.ordersApi.getActiveOrders(page, limit)

        return {
            ...res,
            items: res.items.map((o) => ActiveOrder.fromJSON(o))
        }
    }
}
