import axios from 'axios'
import {HttpProvider, Headers} from './types'

export class AxiosHttpProvider implements HttpProvider {
    async get<T>(url: string, headers: Headers): Promise<T> {
        const res = await axios.get<T>(url, {headers})

        return res.data
    }

    async post<T>(url: string, data: unknown, headers: Headers): Promise<T> {
        const res = await axios.post<T>(url, data, {headers})

        return res.data
    }
}
