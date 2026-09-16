import {ActiveOrder} from './active-order'
import {CancellableOrder} from './cancellable-order'
import {OrderDTO, OrderInfoDTO} from '../api'
import {Address} from '../domains'
import {AuctionDetails, FusionOrder} from '../fusion-order'
import {now} from '../utils'

describe('ActiveOrder', () => {
    const maker = new Address('GZctHpWXmsZC1YHACTGGcHhYxjdRqQvTpYkb9LMvxDib')

    it('should wrap an active-order payload', () => {
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

        const payload: OrderInfoDTO = {
            orderHash: 'hash-1',
            txSignature: 'sig-create',
            maker: maker.toString(),
            order: order.toJSON() as unknown as OrderDTO,
            remainingMakerAmount: '250'
        }
        const active = ActiveOrder.fromJSON(payload)

        expect(active.creationTxSignature).toBe('sig-create')
        expect(active.maker.equal(maker)).toBe(true)
        expect(active.remainingMakerAmount).toBe(250n)
        expect(active.order.getOrderHashBase58()).toBe(
            order.getOrderHashBase58()
        )
    })

    it('should hold a cancelable order pair', () => {
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
        const cancelable = new CancellableOrder(maker, order)

        expect(cancelable.maker.equal(maker)).toBe(true)
        expect(cancelable.order).toBe(order)
    })
})
