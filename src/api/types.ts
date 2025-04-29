export type ApiConfig = {
    baseUrl: string
    authKey?: string
    version: 'v1.0'
}

export type Pagination<T> = {
    meta: {
        totalItems: number
        itemsPerPage: number
        totalPages: number
        currentPage: number
    }
    items: T[]
}

export type Headers = Record<string, string>

export interface HttpProvider {
    get<T>(url: string, headers: Headers): Promise<T>

    post<T>(url: string, data: unknown, headers: Headers): Promise<T>
}
