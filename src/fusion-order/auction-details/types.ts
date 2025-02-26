export type AuctionPoint = {
    /**
     * point in time of this point relatively to previous point. In secs
     */
    delay: number
    /**
     * coefficient rate bump from the end of an auction
     */
    coefficient: number
}
