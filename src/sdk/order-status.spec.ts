import {OrderStatus} from './order-status'
import {OrderDTO, OrderStatus as Status, OrderStatusDTO} from '../api'
import {Address} from '../domains'
import {AuctionDetails, FusionOrder} from '../fusion-order'
import {now} from '../utils'

describe('OrderStatus', () => {
    const maker = new Address('GZctHpWXmsZC1YHACTGGcHhYxjdRqQvTpYkb9LMvxDib')

    it('should parse fills and report whether the order is still active', () => {
        const order = FusionOrder.new(
            {
                srcMint: Address.WRAPPED_NATIVE,
                dstMint: new Address(
                    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
                ),
                srcAmount: 1000n,
                minDstAmount: 2000n,
                estimatedDstAmount: 2000n,
                id: 1,
                receiver: maker
            },
            AuctionDetails.noAuction(now(), 180)
        )
        const payload: OrderStatusDTO = {
            maker: maker.toString(),
            orderHash: 'hash-1',
            status: Status.inProgress,
            order: order.toJSON() as unknown as OrderDTO,
            approximateTakingAmount: '1990',
            expirationTime: order.deadline,
            fills: [
                {
                    txSignature: 'sig',
                    filledMakerAmount: '100',
                    filledAuctionTakerAmount: '200'
                }
            ],
            createdAt: 1,
            srcTokenPriceUsd: 10,
            dstTokenPriceUsd: 1,
            cancelable: true
        }

        const active = OrderStatus.fromJSON(payload)
        const filled = OrderStatus.fromJSON({
            ...payload,
            status: Status.filled,
            fills: [],
            cancelTx: 'cancel-sig'
        })

        expect(active.isActive()).toBe(true)
        expect(filled.isActive()).toBe(false)
        expect(active.fills[0].filledMakerAmount).toBe(100n)
        expect(active.fills[0].filledAuctionTakerAmount).toBe(200n)
        expect(filled.cancelTx).toBe('cancel-sig')
        expect(active.order.getOrderHashBase58()).toBe(
            order.getOrderHashBase58()
        )
    })
})
