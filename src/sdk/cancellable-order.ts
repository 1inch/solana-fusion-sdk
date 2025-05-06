import {Address} from '../domains'
import {FusionOrder} from '../fusion-order'

export class CancellableOrder {
    constructor(
        public readonly maker: Address,
        public readonly order: FusionOrder
    ) {}
}
