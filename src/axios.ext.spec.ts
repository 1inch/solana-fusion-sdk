import {AxiosHttpProvider} from './axios.ext'

describe('axios.ext', () => {
    it('should re-export the axios HTTP provider', () => {
        expect(AxiosHttpProvider).toBeDefined()
        expect(new AxiosHttpProvider()).toBeInstanceOf(AxiosHttpProvider)
    })
})
