import {FusionOrder} from '../fusion-order'
import {Address} from '../domains'
import {OrderStatusDTO, OrderStatus as Status} from '../api'

export class OrderStatus {
    // eslint-disable-next-line max-params
    constructor(
        public readonly maker: Address,
        public readonly orderHash: string,
        public readonly status: Status,
        public readonly order: FusionOrder,
        public readonly approximateTakingAmount: bigint,
        public readonly cancelTx: string | undefined,
        public readonly expirationTime: number,
        public readonly fills: Array<{
            txSignature: string
            filledMakerAmount: bigint
            filledAuctionTakerAmount: bigint
        }>,
        public readonly createdAt: number,
        public readonly srcTokenPriceUsd: number,
        public readonly dstTokenPriceUsd: number,
        public readonly cancelable: boolean
    ) {}

    static fromJSON(json: OrderStatusDTO): OrderStatus {
        return new OrderStatus(
            new Address(json.maker),
            json.orderHash,
            json.status,
            FusionOrder.fromJSON(json.order),
            BigInt(json.approximateTakingAmount),
            json.cancelTx,
            json.expirationTime,
            json.fills.map((f) => ({
                txSignature: f.txSignature,
                filledMakerAmount: BigInt(f.filledMakerAmount),
                filledAuctionTakerAmount: BigInt(f.filledAuctionTakerAmount)
            })),
            json.createdAt,
            json.srcTokenPriceUsd,
            json.dstTokenPriceUsd,
            json.cancelable
        )
    }

    public isActive(): boolean {
        return this.status === Status.inProgress
    }
}
