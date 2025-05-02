# SDK interact with Fusion protocol

**Description:** create, cancel, check order status and more

## Real world example

```typescript
import { Address, FusionSwapContract, Sdk } from '@1inch/solana-fusion-sdk'
import { AxiosHttpProvider } from '@1inch/solana-fusion-sdk/axios'
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js' // v1

const authKey = '...'
const secretKey = Buffer.from('secret', 'base64') // replace to real secret key
const rpc = 'https://api.mainnet-beta.solana.com'

const connection = new Connection(rpc)
const maker = Keypair.fromSecretKey(secretKey)

const sdk = new Sdk(new AxiosHttpProvider(), { baseUrl: 'https://api.1inch.dev/fusion', authKey, version: 'v1.0' })

// create order
// 1 SOL -> USDC
const order = await sdk.createOrder(
  Address.NATIVE, // SOL
  new Address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
  1_000_000_000n, // 1 SOL
  Address.fromPublicKey(maker.publicKey)
)

const contract = FusionSwapContract.default()

// create escrow instruction
const ix = contract.create(order, {
  maker: Address.fromPublicKey(maker.publicKey),
  srcTokenProgram: Address.TOKEN_PROGRAM_ID
})

// generate tx
const createOrderTx = new Transaction().add({
  ...ix,
  programId: new PublicKey(ix.programId.toBuffer()),
  keys: ix.accounts.map((a) => ({
    ...a,
    pubkey: new PublicKey(a.pubkey.toBuffer())
  }))
})

createOrderTx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
createOrderTx.sign(maker)

// broadcast tx
await connection.sendRawTransaction(createOrderTx.serialize())

while (true) {
  const status = await sdk.getOrderStatus(order.getOrderHashBase58())

  if (!status.isActive()) {
    console.log('order finished', status)
    break
  }

  await sleep(1000)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
```

## Creation

**with axios provider**
```typescript

import { Address, FusionSwapContract, Sdk } from '@1inch/solana-fusion-sdk'
import { AxiosHttpProvider } from '@1inch/solana-fusion-sdk/axios'

const sdk = new Sdk(new AxiosHttpProvider(), { baseUrl: 'https://api.1inch.dev/fusion', authKey: 'your key', version: 'v1.0' })
```


**with custom provider**
```typescript

import { Address, FusionSwapContract, Sdk, HttpProvider } from '@1inch/solana-fusion-sdk'

class MyProvider implements HttpProvider {
  // implement methods
}

const sdk = new Sdk(new MyProvider(), { baseUrl: 'https://api.1inch.dev/fusion', authKey: 'your key', version: 'v1.0' })
```

## Methods

### getQuote
**Description:** get quote for order

**Arguments:**
- [0] srcToken: [Address](../domains/address.ts) src token mint address
- [1] dstToken: [Address](../domains/address.ts) dst token mint address
- [2] amount: bigint src amount
- [3] signer: [Address](../domains/address.ts) user address
- [4] slippage?: Bps max slippage

**Returns:** [Quote](./quote.ts)


### createOrder
**Description:** create fusion order

**Arguments:**
- [0] srcToken: [Address](../domains/address.ts) src token mint address
- [1] dstToken: [Address](../domains/address.ts) dst token mint address
- [2] amount: bigint src amount
- [3] signer: [Address](../domains/address.ts) user address
- [4] slippage?: Bps max slippage

**Returns:** [FusionOrder](../fusion-order/fusion-order.ts)

### getOrderStatus
**Description:** get order status

**Arguments:**
- [0] orderHash: string use `FusionOrder.getOrderHashBase58` to get order hash

**Returns:** [OrderStatus](./order-status.ts)
