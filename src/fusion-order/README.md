# FusionOrder

Contains order params, can be submitted on-chain to create escrow.

## Creation

### from params

```typescript
import {
    AuctionDetails,
    FusionOrder,
    now,
    Address,
    id
} from '@1inch/solana-fusion-sdk'

const order = FusionOrder.new(
    {
        srcMint: Address.NATIVE,
        dstMint: new Address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        srcAmount: 1000000000000000000n,
        minDstAmount: 1420000000n,
        estimatedDstAmount: 1420000000n,
        id: id(),
        receiver: Address.fromBigInt(1n)
    },
    AuctionDetails.noAuction(now(), 180) // expired in 3m
)
```

### from JSON

```typescript
import {FusionOrder} from '@1inch/solana-fusion-sdk'

const order = FusionOrder.fromJSON({
    id: 3384470318,
    fee: {
        protocolFee: 0,
        integratorFee: 0,
        protocolDstAta: null,
        integratorDstAta: null,
        surplusPercentage: 0,
        maxCancellationPremium: '1'
    },
    dstMint: 'boopkpWqe68MSxLqBGogs8ZbUDN4GXaLhFwNP7mpP1i',
    srcMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    receiver: '4hYy2LUC7j2g469vmoXZJjnsvkBdRXNWYxFYiBm5Lfk9',
    srcAmount: '7504317665',
    minDstAmount: '30695497527417',
    expirationTime: 1746162263,
    dstAssetIsNative: false,
    dutchAuctionData: {
        duration: 24,
        startTime: 1746162227,
        initialRateBump: 503,
        pointsAndTimeDeltas: [{rateBump: 433, timeDelta: 120}]
    },
    srcAssetIsNative: false,
    estimatedDstAmount: '30695497527417',
    cancellationAuctionDuration: 1
})
```

## Getters

### fees
**Returns:** [FeeConfig](./fee-config/fee-config.ts) or `null` if order have no fees

### resolverCancellationConfig
**Returns:** [ResolverCancellationConfig](./resolver-cancellation-config/resolver-cancellation-config.ts) or `null` if order can not be cancelled by resolver

### srcMint
**Returns:** [Address](./address/address.ts) of source mint

### dstMint
**Returns:** [Address](./address/address.ts) of destination mint

### srcAmount
**Returns:** `bigint` source amount

### minDstAmount
**Returns:** `bigint` minimum destination amount

### estimateDstAmount
**Returns:** `bigint` estimated destination amount

### receiver
**Returns:** [Address](./address/address.ts) of receiver of funds

### deadline
**Returns:** `number` UNIX timestamp of order expiration time (in sec)

### auctionStartTime
**Returns:** `number` UNIX timestamp of auction start time (in sec)

### auctionEndTime
**Returns:** `number` UNIX timestamp of auction end time (in sec)

### auctionDetails
**Returns:** [AuctionDetails](./auction-details/auction-details.ts) Auction params

### id
**Returns:** `number` Order id

### srcAssetIsNative
**Returns:** `boolean` `true` if source asset is SOL, `false` otherwise

### dstAssetIsNative
**Returns:** `boolean` `true` if destination asset is SOL, `false` otherwise

## Methods

### build
**Description:** Transform order to contract order implementation.

### toJSON
**Description:** Serialize order to JSON object. Can be deserialized back with [fromJSON](#from-json)

### getOrderHash
**Description:** Calculate `sha256` of order params

**Returns:** `Buffer` order hash as bytes

### getOrderHashBase58
**Description:** Calculate `sha256` of order params

**Returns:** `string` order hash as base 58 encoded string

### getEscrow
**Description:** Returns escrow [ata](https://spl.solana.com/associated-token-account) for src token

**Arguments:**
- [0] maker `AddressLike`
- [1] srcTokenProgram `AddressLike` owner of src token mint
- [2] programId `AddressLike` FusionSwap program id

**Returns:** [Address](./address/address.ts) escrow ata address

### calcTakingAmount
**Description:** Calculate `dstAmount` for given `srcAmount` at block `time`

**Arguments:**
- [0] srcAmount `bigint` source amount to fill
- [1] time `number` UNIX timestamp in sec at which fill will be executed

**Returns:** dstAmount `bigint` how much resolver must provide

### getUserReceiveAmount
**Description:** Calculate how much user will receive in dst token

**Arguments:**
- [0] srcAmount `bigint` source amount to fill
- [1] time `number` UNIX timestamp in sec at which fill will be executed

**Returns:** dstAmount `bigint` how much user will receive

### getIntegratorFee
**Description:** Calculate how much `dstToken` integrator will receive

**Arguments:**
- [0] srcAmount `bigint` source amount to fill
- [1] time `number` UNIX timestamp in sec at which fill will be executed

**Returns:** feeAmount `bigint` how much integrator will receive

### getProtocolFee
**Description:** Calculate how much `dstToken` protocol will receive

**Arguments:**
- [0] srcAmount `bigint` source amount to fill
- [1] time `number` UNIX timestamp in sec at which fill will be executed

**Returns:** feeAmount `bigint` how much protocol will receive

### isExpiredAt
**Description:** Check if order expired at given time

**Arguments:**
- [0] time `number` UNIX timestamp in sec

**Returns:** isExpired `boolean` true if order expired at given time

### getCalculator
**Description:** Build [AmountCalculator](../amount-calculator/amount-calculator.ts) based on order params

**Returns:** [AmountCalculator](../amount-calculator/amount-calculator.ts)
