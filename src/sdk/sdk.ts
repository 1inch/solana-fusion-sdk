import {Quote} from './quote'
import {OrderStatus} from './order-status'
import {FusionOrder} from '../fusion-order'
import {Address, Bps} from '../domains'
import {ApiConfig, HttpProvider, OrdersApi, QuoterApi} from '../api'

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
}
