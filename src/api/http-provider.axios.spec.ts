import axios from 'axios'
import {AxiosHttpProvider} from './http-provider.axios'

jest.mock('axios')

describe('AxiosHttpProvider', () => {
    const axiosMock = axios as jest.Mocked<typeof axios>

    beforeEach(() => {
        axiosMock.get.mockReset()
        axiosMock.post.mockReset()
    })

    it('should return the response body from GET', async () => {
        axiosMock.get.mockResolvedValue({data: {ok: true}})
        const provider = new AxiosHttpProvider()

        await expect(
            provider.get('https://example.test/quote', {
                Authorization: 'Bearer x'
            })
        ).resolves.toEqual({ok: true})
        expect(axiosMock.get).toHaveBeenCalledWith(
            'https://example.test/quote',
            {headers: {Authorization: 'Bearer x'}}
        )
    })

    it('should return the response body from POST', async () => {
        axiosMock.post.mockResolvedValue({data: {id: 1}})
        const provider = new AxiosHttpProvider()

        await expect(
            provider.post('https://example.test/orders', {a: 1}, {})
        ).resolves.toEqual({id: 1})
        expect(axiosMock.post).toHaveBeenCalledWith(
            'https://example.test/orders',
            {a: 1},
            {headers: {}}
        )
    })
})
