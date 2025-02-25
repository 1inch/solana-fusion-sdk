import {WritableDeep} from 'type-fest'

const _IDL = {
    address: '9hbsrgqQUYBPdAiriyn5A7cr3zBzN3EmeXN6mJLyizHh',
    metadata: {
        name: 'fusionSwap',
        version: '0.1.0',
        spec: '0.1.0',
        description: 'Created with Anchor'
    },
    instructions: [
        {
            name: 'cancel',
            discriminator: [232, 219, 223, 41, 219, 236, 220, 190],
            accounts: [
                {
                    name: 'maker',
                    docs: ['Account that created the escrow'],
                    writable: true,
                    signer: true
                },
                {name: 'srcMint', docs: ['Maker asset']},
                {
                    name: 'escrow',
                    docs: ['Account to store order conditions'],
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [101, 115, 99, 114, 111, 119]
                            },
                            {
                                kind: 'account',
                                path: 'maker'
                            },
                            {kind: 'arg', path: 'orderHash'}
                        ]
                    }
                },
                {
                    name: 'escrowSrcAta',
                    docs: ['ATA of src_mint to store escrowed tokens'],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {
                                kind: 'account',
                                path: 'srcTokenProgram'
                            },
                            {kind: 'account', path: 'srcMint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'makerSrcAta',
                    docs: ["Maker's ATA of src_mint"],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'maker'},
                            {
                                kind: 'account',
                                path: 'srcTokenProgram'
                            },
                            {kind: 'account', path: 'srcMint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'srcTokenProgram'}
            ],
            args: [{name: 'orderHash', type: {array: ['u8', 32]}}]
        },
        {
            name: 'create',
            discriminator: [24, 30, 200, 40, 5, 28, 7, 119],
            accounts: [
                {
                    name: 'maker',
                    docs: [
                        '`maker`, who is willing to sell src token for dst token'
                    ],
                    writable: true,
                    signer: true
                },
                {name: 'srcMint', docs: ['Source asset']},
                {
                    name: 'dstMint',
                    docs: ['Destination asset']
                },
                {
                    name: 'makerSrcAta',
                    docs: ["Maker's ATA of src_mint"],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'maker'},
                            {
                                kind: 'account',
                                path: 'srcTokenProgram'
                            },
                            {kind: 'account', path: 'srcMint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'makerReceiver'},
                {
                    name: 'escrow',
                    docs: ['Account to store order conditions']
                },
                {
                    name: 'escrowSrcAta',
                    docs: ['ATA of src_mint to store escrowed tokens'],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {
                                kind: 'account',
                                path: 'srcTokenProgram'
                            },
                            {kind: 'account', path: 'srcMint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'protocolDstAta', optional: true},
                {
                    name: 'integratorDstAta',
                    optional: true
                },
                {
                    name: 'associatedTokenProgram',
                    address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
                },
                {name: 'srcTokenProgram'},
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: [
                {name: 'order', type: {defined: {name: 'reducedOrderConfig'}}}
            ]
        },
        {
            name: 'fill',
            discriminator: [168, 96, 183, 163, 92, 10, 40, 160],
            accounts: [
                {
                    name: 'taker',
                    docs: ['`taker`, who buys `src_mint` for `dst_mint`'],
                    writable: true,
                    signer: true
                },
                {
                    name: 'resolverAccess',
                    docs: ['Account allowed to fill the order'],
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    114, 101, 115, 111, 108, 118, 101, 114, 95,
                                    97, 99, 99, 101, 115, 115
                                ]
                            },
                            {kind: 'account', path: 'taker'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                38, 236, 245, 92, 234, 101, 113, 197, 44, 9, 86,
                                204, 101, 135, 29, 146, 55, 150, 163, 138, 120,
                                130, 108, 248, 12, 230, 28, 220, 211, 97, 69,
                                171
                            ]
                        }
                    }
                },
                {name: 'maker', writable: true},
                {name: 'makerReceiver'},
                {
                    name: 'srcMint',
                    docs: ['Maker asset']
                },
                {name: 'dstMint', docs: ['Taker asset']},
                {
                    name: 'escrow',
                    docs: ['Account to store order conditions']
                },
                {
                    name: 'escrowSrcAta',
                    docs: ['ATA of src_mint to store escrowed tokens'],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {
                                kind: 'account',
                                path: 'srcTokenProgram'
                            },
                            {kind: 'account', path: 'srcMint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'makerDstAta',
                    docs: ["Maker's ATA of dst_mint"],
                    writable: true,
                    optional: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'makerReceiver'},
                            {
                                kind: 'account',
                                path: 'dstTokenProgram'
                            },
                            {kind: 'account', path: 'dstMint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'protocolDstAta', writable: true, optional: true},
                {
                    name: 'integratorDstAta',
                    writable: true,
                    optional: true
                },
                {
                    name: 'takerSrcAta',
                    docs: ["Taker's ATA of src_mint"],
                    writable: true
                },
                {
                    name: 'takerDstAta',
                    docs: ["Taker's ATA of dst_mint"],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'taker'},
                            {
                                kind: 'account',
                                path: 'dstTokenProgram'
                            },
                            {kind: 'account', path: 'dstMint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'srcTokenProgram'},
                {name: 'dstTokenProgram'},
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                },
                {
                    name: 'associatedTokenProgram',
                    address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
                }
            ],
            args: [
                {
                    name: 'reducedOrder',
                    type: {defined: {name: 'reducedOrderConfig'}}
                },
                {
                    name: 'amount',
                    type: 'u64'
                }
            ]
        }
    ],
    accounts: [
        {
            name: 'resolverAccess',
            discriminator: [32, 2, 74, 248, 174, 108, 70, 156]
        }
    ],
    errors: [
        {
            code: 6000,
            name: 'inconsistentNativeDstTrait',
            msg: 'Inconsistent native dst trait'
        },
        {code: 6001, name: 'invalidAmount', msg: 'Invalid amount'},
        {
            code: 6002,
            name: 'missingMakerDstAta',
            msg: 'Missing maker dst ata'
        },
        {
            code: 6003,
            name: 'notEnoughTokensInEscrow',
            msg: 'Not enough tokens in escrow'
        },
        {
            code: 6004,
            name: 'orderExpired',
            msg: 'Order expired'
        },
        {
            code: 6005,
            name: 'invalidEstimatedTakingAmount',
            msg: 'Invalid estimated taking amount'
        },
        {
            code: 6006,
            name: 'invalidProtocolSurplusFee',
            msg: 'Protocol surplus fee too high'
        },
        {
            code: 6007,
            name: 'inconsistentProtocolFeeConfig',
            msg: 'Inconsistent protocol fee config'
        },
        {
            code: 6008,
            name: 'inconsistentIntegratorFeeConfig',
            msg: 'Inconsistent integrator fee config'
        }
    ],
    types: [
        {
            name: 'dutchAuctionData',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'startTime', type: 'u32'},
                    {
                        name: 'duration',
                        type: 'u32'
                    },
                    {name: 'initialRateBump', type: 'u16'},
                    {
                        name: 'pointsAndTimeDeltas',
                        type: {vec: {defined: {name: 'pointAndTimeDelta'}}}
                    }
                ]
            }
        },
        {
            name: 'pointAndTimeDelta',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'rateBump', type: 'u16'},
                    {name: 'timeDelta', type: 'u16'}
                ]
            }
        },
        {
            name: 'reducedFeeConfig',
            docs: ['Configuration for fees applied to the escrow'],
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'protocolFee',
                        docs: [
                            'Protocol fee in basis points where `BASE_1E5` = 100%'
                        ],
                        type: 'u16'
                    },
                    {
                        name: 'integratorFee',
                        docs: [
                            'Integrator fee in basis points where `BASE_1E5` = 100%'
                        ],
                        type: 'u16'
                    },
                    {
                        name: 'surplusPercentage',
                        docs: [
                            'Percentage of positive slippage taken by the protocol as an additional fee.',
                            'Value in basis points where `BASE_1E2` = 100%'
                        ],
                        type: 'u8'
                    }
                ]
            }
        },
        {
            name: 'reducedOrderConfig',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'id', type: 'u32'},
                    {name: 'srcAmount', type: 'u64'},
                    {
                        name: 'minDstAmount',
                        type: 'u64'
                    },
                    {name: 'estimatedDstAmount', type: 'u64'},
                    {
                        name: 'expirationTime',
                        type: 'u32'
                    },
                    {name: 'nativeDstAsset', type: 'bool'},
                    {
                        name: 'fee',
                        type: {defined: {name: 'reducedFeeConfig'}}
                    },
                    {
                        name: 'dutchAuctionData',
                        type: {defined: {name: 'dutchAuctionData'}}
                    }
                ]
            }
        },
        {name: 'resolverAccess', type: {kind: 'struct', fields: []}}
    ]
} as const
export const IDL: WritableDeep<typeof _IDL> = _IDL as WritableDeep<typeof _IDL>
