import {castUrl} from './url'
import {PaginationRequest} from './types'

describe('castUrl', () => {
    it('should rewrite http to ws and leave an existing ws url', () => {
        expect(castUrl('https://ws.example/fusion')).toBe(
            'wss://ws.example/fusion'
        )
        expect(castUrl('http://localhost:8080')).toBe('ws://localhost:8080')
        expect(castUrl('wss://ws.example/fusion')).toBe(
            'wss://ws.example/fusion'
        )
    })
})

describe('PaginationRequest', () => {
    it('should accept omitted page and limit', () => {
        const request = new PaginationRequest(undefined, undefined)

        expect(request.page).toBeUndefined()
        expect(request.limit).toBeUndefined()
    })

    it('should reject a limit outside 1..500', () => {
        expect(() => new PaginationRequest(1, 0)).toThrow(
            'limit should be in range between 1 and 500'
        )
        expect(() => new PaginationRequest(1, 501)).toThrow(
            'limit should be in range between 1 and 500'
        )
    })

    it('should reject a page below 1', () => {
        expect(() => new PaginationRequest(0, 10)).toThrow(
            'page should be >= 1'
        )
    })
})
