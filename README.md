# Solana Fusion SDK


## Installation

Add to `package.json`
```json
{
  "dependencies": {
    "@1inch/solana-fusion-sdk": "@1inch/solana-fusion-sdk"
  }
}
```

## Docs
- [FusionOrder](./src/fusion-order/README.md)
- [SDK](./src/sdk/README.md)
- [Websocket Api](./src/ws-api/README.md)

## Getting started

### For user

#### Create and submit order

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

// quote and create order
// 1 SOL -> USDC
// when the quote carries partner fees the order embeds them automatically
const quote = await sdk.getQuote(
  Address.NATIVE, // SOL
  new Address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
  1_000_000_000n, // 1 SOL
  Address.fromPublicKey(maker.publicKey)
)
const order = quote.toOrder()

const contract = FusionSwapContract.default()

// create escrow instruction
const ix = contract.create(order, {
  maker: Address.fromPublicKey(maker.publicKey),
  srcTokenProgram: Address.TOKEN_PROGRAM_ID
})

// generate tx
// for an SPL destination prepend the idempotent fee-ata creates — those accounts must exist at fill time
const createOrderTx = new Transaction()

for (const instruction of [...quote.getFeeAtaCreateInstructions(), ix]) {
  createOrderTx.add({
    ...instruction,
    programId: new PublicKey(instruction.programId.toBuffer()),
    keys: instruction.accounts.map((a) => ({
      ...a,
      pubkey: new PublicKey(a.pubkey.toBuffer())
    }))
  })
}

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

When the destination is native SOL, fees are paid to the receiver wallets directly — those wallets must already be funded (rent-exempt), otherwise fills will fail.

#### Cancel order

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

const order = ... // see 'Create and submit order' section
const contract = FusionSwapContract.default()

// close escrow instruction
const ix = contract.cancelOwnOrder(order, {
  maker: Address.fromPublicKey(maker.publicKey),
  srcTokenProgram: Address.TOKEN_PROGRAM_ID
})

// generate tx
const cancelOrderTx = new Transaction().add({
  ...ix,
  programId: new PublicKey(ix.programId.toBuffer()),
  keys: ix.accounts.map((a) => ({
    ...a,
    pubkey: new PublicKey(a.pubkey.toBuffer())
  }))
})

cancelOrderTx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
cancelOrderTx.sign(maker)

// broadcast tx
await connection.sendRawTransaction(createOrderTx.serialize())
```

### For resolver

#### Fill order

```typescript
import { Address, FusionSwapContract, Sdk } from '@1inch/solana-fusion-sdk'
import { AxiosHttpProvider } from '@1inch/solana-fusion-sdk/axios'
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js' // v1

const authKey = '...'
const secretKey = Buffer.from('secret', 'base64') // replace to real secret key
const rpc = 'https://api.mainnet-beta.solana.com'

const connection = new Connection(rpc)
const resolver = Keypair.fromSecretKey(secretKey)

const sdk = new Sdk(new AxiosHttpProvider(), { baseUrl: 'https://api.1inch.dev/fusion', authKey, version: 'v1.0' })
const contract = FusionSwapContract.default()

const activeOrders = await sdk.getActiveOrders()
const orderToFill = activeOrders[0]

// fill order instruction
const ix = contract.fill(
  orderToFill.order,
  orderToFill.remainingMakerAmount, // fill for remaining amount
  accounts: {
      taker: Address.fromPublicKey(resolver.publicKey),
      maker: orderToFill.maker
      srcTokenProgram: Address.TOKEN_PROGRAM_ID,
      dstTokenProgram: Address.TOKEN_PROGRAM_ID,
  }
)

// generate tx
const fillTx = new Transaction().add({
  // at the moment of `ix` execution resolver must have enough source token, so it can be transferred to user
  ...ix,
  programId: new PublicKey(ix.programId.toBuffer()),
  keys: ix.accounts.map((a) => ({
    ...a,
    pubkey: new PublicKey(a.pubkey.toBuffer())
  }))
})

fillTx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
fillTx.sign(resolver)

// broadcast tx
await connection.sendRawTransaction(createOrderTx.serialize())
```


#### Cancel order

For canceling expired orders, a resolver will be paid `order.resolverCancellationConfig.maxCancellationPremium` lamports

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

const cancellableOrders = await sdk.getOrdersCancellableByResolver()
const order = cancellableOrders[0]
const contract = FusionSwapContract.default()

// close escrow instruction
const ix = contract.cancelOrderByResolver(order.order, {
  maker: order.maker,
  resolver: Address.fromPublicKey(resolver.publicKey),
  srcTokenProgram: Address.TOKEN_PROGRAM_ID
})

// generate tx
const cancelOrderTx = new Transaction().add({
  ...ix,
  programId: new PublicKey(ix.programId.toBuffer()),
  keys: ix.accounts.map((a) => ({
    ...a,
    pubkey: new PublicKey(a.pubkey.toBuffer())
  }))
})

cancelOrderTx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
cancelOrderTx.sign(resolver)

// broadcast tx
await connection.sendRawTransaction(createOrderTx.serialize())
```
