import {OrdersApi} from './orders-api'
import {HttpProvider} from '../types'

describe('OrdersApi', () => {
    it('should call the active, status and cancelable endpoints without auth', async () => {
        const get = jest.fn(
            async (url: string, _headers?: Record<string, string>) => ({url})
        )
        const api = new OrdersApi(
            {get, post: jest.fn()} as unknown as HttpProvider,
            {baseUrl: 'https://api.example', version: 'v1.0'}
        )

        await expect(api.getActiveOrders()).resolves.toEqual({
            url: 'https://api.example/orders/v1.0/501/order/active?limit=100&page=1'
        })
        await expect(api.getOrderStatus('abc')).resolves.toEqual({
            url: 'https://api.example/orders/v1.0/501/order/status/abc'
        })
        await expect(
            api.getOrdersCancellableByResolver(2, 10)
        ).resolves.toEqual({
            url: 'https://api.example/orders/v1.0/501/order/cancelable-by-resolvers?limit=10&page=2'
        })
        expect(get.mock.calls[0][1]).toEqual({})
    })

    it('should send a bearer token when an auth key is configured', async () => {
        const get = jest.fn(async () => ({}))
        const api = new OrdersApi(
            {get, post: jest.fn()} as unknown as HttpProvider,
            {
                baseUrl: 'https://api.example',
                version: 'v1.0',
                authKey: 'secret'
            }
        )

        await api.getActiveOrders(3, 25)

        expect(get).toHaveBeenCalledWith(
            'https://api.example/orders/v1.0/501/order/active?limit=25&page=3',
            {Authorization: 'Bearer secret'}
        )
    })
})
