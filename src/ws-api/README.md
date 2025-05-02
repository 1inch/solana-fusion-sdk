# Websocket Api

Subscribe to real time fusion events

## Real world example

```typescript
import {WebSocketApi} from '@1inch/solana-fusion-sdk'

const wsSdk = WebSocketApi.fromConfig({
    url: 'wss://api.1inch.dev/fusion/ws',
    authKey: 'your-auth-key'
})

wsSdk.order.onOrder((data) => {
    console.log('received order event', data)
})
```

## Creation

**With config:**

```typescript
import {WebSocketApi} from '@1inch/solana-fusion-sdk'

const ws = WebSocketApi.fromConfig({
    url: 'wss://api.1inch.dev/fusion/ws',
    authKey: 'your-auth-key'
})
```

**Custom provider:**

User can provide custom provider for websocket (be default we are using [ws library](https://www.npmjs.com/package/ws))

```typescript
import {WsProviderConnector, WebSocketApi} from '@1inch/solana-fusion-sdk'

class MyFancyProvider extends WsProviderConnector {
    // ... user implementation
}

const url = 'wss://api.1inch.dev/fusion/ws/v1.0/501'
const provider = new MyFancyProvider({url})

const wsSdk = WebSocketApi.fromProvider(provider)
```


**Lazy initialization:**

By default, when user creates an instance of WebSocketApi, it automatically opens websocket connection which might be a problem for some use cases.
It is possible to pass `lazyInit` flag to prevent automatic initialization. Then to use client you need to call `init()` method.

```typescript
import {WebSocketApi} from '@1inch/solana-fusion-sdk'

const ws = WebSocketApi.fromConfig({
    url: 'wss://api.1inch.dev/fusion/ws',
    lazyInit: true
})

ws.init()
```

## Methods

**Base methods**

### on

**Description**: You can subscribe to any event

**Arguments**:

-   [0] event: WebSocketEvent
-   [1] cb: Function

**Example:**

```typescript
import {WebSocketEvent} from '@1inch/solana-fusion-sdk'

const ws = ...

ws.on(WebSocketEvent.Error, console.error)

ws.on(WebSocketEvent.Open, function open() {
    ws.send('something')
})

ws.on(WebSocketEvent.Message, function message(data) {
    console.log('received: %s', data)
})
```

### off

**Description**: You can unsubscribe from any event

**Arguments**:

-   [0] event: WebSocketEvent
-   [1] cb: Function

**Example:**

```typescript
import {WebSocketEvent} from '@1inch/solana-fusion-sdk'

const ws = ...

function message(data) {
    console.log('received: %s', data)
}

ws.on(WebSocketEvent.Message, message)

ws.off(WebSocketEvent.Message, message)
```

### onOpen

**Description**: subscribe to open event

**Arguments**:

-   [0] cb: Function

**Example:**

```typescript
const ws = ...
ws.onOpen(() => {
    console.log('connection is opened')
})
```

### send

**Description**: send event to backend

**Arguments**:

-   [0] message: any message which can be serialized with JSON.stringify

**Example:**

```typescript
const ws = ...

ws.send('my message')
```

### close

**Description**: close connection

**Example:**

```typescript
const ws = ...

ws.close()
```

### onMessage

**Description**: subscribe to message event

**Arguments**:

-   [0] cb: (data: any) => void

**Example:**

```typescript
const ws = ...


ws.onMessage((data) => {
    console.log('message received', data)
})
```

### onClose

**Description**: subscribe to close event

**Example:**

```typescript
const ws = ...


ws.onClose(() => {
    console.log('connection is closed')
})
```

### onError

**Description**: subscribe to error event

**Arguments**:

-   [0] cb: (error: any) => void

**Example:**

```typescript
const ws = ...


ws.onError((error) => {
    console.log('error is received', error)
})
```

**Order namespace**

### onOrder

**Description:** subscribe to order events

**Arguments:**

-   [0] cb: (data: OrderEventType) => void

**Example:**

```typescript
import {EventType} from '@1inch/solana-fusion-sdk'

const ws = ...

ws.order.onOrder((data) => {
    if (data.event === EventType.Create) {
        // do something
    }

    if (data.event === EventType.Fill) {
        // do something
    }
})
```

### onOrderCreated

**Description:** subscribe to order_created events

**Arguments:**

-   [0] cb: (data: OrderCreatedEvent) => void

**Example:**

```typescript
const ws = ...

ws.order.onOrderCreated((data) => {
    // do something
})
```

### onOrderFilled

**Description:** subscribe to order_filled events

**Arguments:**

-   [0] cb: (data: OrderFilledEvent) => void

**Example:**

```typescript
const ws = ...

ws.order.onOrderFilled((data) => {
    // do something
})
```

### onOrderCancelled

**Description:** subscribe to order_cancelled events

**Arguments:**

-   [0] cb: (data: OrderCancelledEvent) => void

**Example:**

```typescript
const ws = ...

ws.order.onOrderCancelled((data) => {
    // do something
})
```

**Rpc namespace**

### onPong

**Description:** subscribe to ping response

**Example:**

```typescript
const ws = ...

ws.rpc.onPong(() => {
    // do something
})
```

### ping

**Description:** ping healthcheck

**Example:**

```typescript
const ws = ...
ws.rpc.ping()
```

### getAllowedMethods

**Description:** get the list of allowed methods

**Example:**

```typescript
const ws = ...
ws.rpc.getAllowedMethods()
```

### onGetAllowedMethods

**Description:** subscribe to get allowed methods response

**Arguments:**

-   [0] cb: (data: RpcMethod[]) => void

**Example:**

```typescript
const ws = ...

ws.rpc.onGetAllowedMethods((data) => {
    // do something
})
```

### getActiveOrders

**Description:** get the list of active orders

**Example:**

```typescript
const ws = ...

ws.rpc.getActiveOrders()
```

### onGetActiveOrders

**Description:** subscribe to get active orders events

**Arguments:**

-   [0] cb: (data: PaginationOutput<ActiveOrder>[]) => void

**Example:**

```typescript
const ws = ...

ws.rpc.onGetActiveOrders((data) => {
    // do something
})
```

## Types

### OrderEventType

```typescript
import {OrderType} from './types'

export type Event<K extends string, T> = {
    event: K
    result: T
}

export type OrderEventType =
    | OrderCreatedEvent
    | OrderFilledEvent
    | OrderCancelledEvent

export enum EventType {
    Create = 'create',
    Fill = 'fill',
    Cancel = 'cancel'
}

export type CreateOrderEventPayload = {
    transactionSignature: string
    slotNumber: number
    blockTime: number
    action: string
    commitment: string
    orderHash: string
    maker: string
    order: Jsonify<FusionOrder>
    filledAuctionTakerAmount: string
    filledMakerAmount: string
}

export type FillOrderEventPayload = {
    transactionSignature: string
    slotNumber: number
    blockTime: number
    action: string
    commitment: string
    orderHash: string
    maker: string
    resolver: string
    filledAuctionTakerAmount: string
    filledMakerAmount: string
}

export type CancelOrderEventPayload = {
    transactionSignature: string
    slotNumber: number
    blockTime: number
    action: string
    commitment: string
    orderHash: string
    maker: string
    filledAuctionTakerAmount: string
    filledMakerAmount: string
}

export type OrderCreatedEvent = Event<EventType.Create, CreateOrderEventPayload>

export type OrderFilledEvent = Event<EventType.Fill, FillOrderEventPayload>

export type OrderCancelledEvent = Event<
    EventType.Cancel,
    CancelOrderEventPayload
>
```

### RpcMethod

```typescript
export enum RpcMethod {
    GetAllowedMethods = 'getAllowedMethods',
    Ping = 'ping',
    GetActiveOrders = 'getActiveOrders'
}
```
