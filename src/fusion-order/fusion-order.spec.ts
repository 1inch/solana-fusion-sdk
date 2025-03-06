import {FusionOrder} from './fusion-order'
import {AuctionDetails} from './auction-details'
import {Address} from '../domains'
import {now} from '../utils'
import {FusionSwapContract} from '../contracts'

describe('Fusion Order', () => {
    it('should decode fusion order from instruction', () => {
        const order = new FusionOrder(
            {
                srcMint: Address.WRAPPED_NATIVE,
                dstMint: new Address(
                    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
                ),
                srcAmount: 1000000000000000000n,
                minDstAmount: 1420000000n,
                estimatedDstAmount: 1420000000n,
                id: 1,
                receiver: Address.fromBigInt(1n)
            },
            AuctionDetails.noAuction(now(), 180)
        )

        const contract = FusionSwapContract.default()
        const createIx = contract.create(order, {
            maker: Address.fromBigInt(1n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID
        })

        const fillIx = contract.fill(order, 100n, {
            maker: Address.fromBigInt(1n),
            taker: Address.fromBigInt(2n),
            srcTokenProgram: Address.TOKEN_PROGRAM_ID,
            dstTokenProgram: Address.TOKEN_PROGRAM_ID
        })

        expect(FusionOrder.fromCreateInstruction(createIx)).toEqual(order)
        expect(FusionOrder.fromFillInstruction(fillIx)).toEqual(order)
    })
})
