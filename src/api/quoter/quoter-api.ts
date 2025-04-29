import {QuoteDTO} from './types'
import {ApiConfig, HttpProvider, Headers} from '../types'
import {Address, Bps} from '../../domains'

export class QuoterApi {
    private readonly baseUrl: string

    private readonly headers: Headers

    constructor(
        private readonly httpClient: HttpProvider,
        config: ApiConfig
    ) {
        this.baseUrl = `${config.baseUrl}/quoter/${config.version}/501`
        this.headers = config.authKey
            ? {
                  Authorization: `Bearer ${config.authKey}`
              }
            : {}
    }

    public async getQuote(
        srcToken: Address,
        dstToken: Address,
        amount: bigint,
        signer: Address,
        /**
         * if enabled then generates quoteId
         */
        enableEstimate: boolean,
        slippage?: Bps
    ): Promise<QuoteDTO> {
        const params = new URLSearchParams({
            srcToken: srcToken.toString(),
            dstToken: dstToken.toString(),
            amount: amount.toString(),
            wallet: signer.toString(),
            enableEstimate: enableEstimate.toString()
        })

        if (slippage) {
            params.append('slippage', slippage.toPercent().toString())
        }

        return this.httpClient.get(
            `${this.baseUrl}/quote?${params}`,
            this.headers
        )
    }
}
