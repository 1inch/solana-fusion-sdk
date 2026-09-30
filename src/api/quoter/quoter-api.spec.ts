import {QuoterApi} from './quoter-api'
import {HttpProvider} from '../types'
import {Address, Bps} from '../../domains'

describe('QuoterApi', () => {
    const src = new Address('So11111111111111111111111111111111111111112')
    const dst = new Address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
    const signer = Address.fromBigInt(1n)

    it('should request a quote without slippage or auth', async () => {
        const get = jest.fn(
            async (url: string, _headers?: Record<string, string>) => ({url})
        )
        const api = new QuoterApi(
            {get, post: jest.fn()} as unknown as HttpProvider,
            {baseUrl: 'https://api.example', version: 'v1.0'}
        )

        const result = await api.getQuote(src, dst, 1000n, signer, true)

        expect(result).toEqual({
            url: `https://api.example/quoter/v1.0/501/quote?srcToken=${src}&dstToken=${dst}&amount=1000&wallet=${signer}&enableEstimate=true`
        })
        expect(get.mock.calls[0][1]).toEqual({})
    })

    it('should append slippage and send a bearer token', async () => {
        const get = jest.fn(async () => ({}))
        const api = new QuoterApi(
            {get, post: jest.fn()} as unknown as HttpProvider,
            {
                baseUrl: 'https://api.example',
                version: 'v1.0',
                authKey: 'secret'
            }
        )

        await api.getQuote(src, dst, 1000n, signer, false, Bps.fromPercent(1))

        expect(get).toHaveBeenCalledWith(
            `https://api.example/quoter/v1.0/501/quote?srcToken=${src}&dstToken=${dst}&amount=1000&wallet=${signer}&enableEstimate=false&slippage=1`,
            {Authorization: 'Bearer secret'}
        )
    })
})
