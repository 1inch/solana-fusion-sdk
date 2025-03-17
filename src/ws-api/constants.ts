import {EventType, OrderEventType} from './types'

export const orderEvents: OrderEventType['event'][] = [
    EventType.Create,
    EventType.Fill,
    EventType.Cancel
]
