import {WritableDeep} from 'type-fest'
const _IDL = {
    address: 'HNarfxC3kYMMhFkxUFeYb8wHVdPzY5t9pupqW5fL2meM',
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
                    docs: [
                        'PDA derived from order details, acting as the authority for the escrow ATA'
                    ],
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [101, 115, 99, 114, 111, 119]
                            },
                            {kind: 'account', path: 'maker'},
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
                            {kind: 'account', path: 'srcTokenProgram'},
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
                    optional: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'maker'},
                            {kind: 'account', path: 'srcTokenProgram'},
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
            args: [
                {name: 'orderHash', type: {array: ['u8', 32]}},
                {name: 'orderSrcAssetIsNative', type: 'bool'}
            ]
        },
        {
            name: 'cancelByResolver',
            discriminator: [229, 180, 171, 131, 171, 6, 60, 191],
            accounts: [
                {
                    name: 'resolver',
                    docs: ['Account that cancels the escrow'],
                    writable: true,
                    signer: true
                },
                {
                    name: 'resolverAccess',
                    docs: ['Account allowed to cancel the order'],
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    114, 101, 115, 111, 108, 118, 101, 114, 95,
                                    97, 99, 99, 101, 115, 115
                                ]
                            },
                            {kind: 'account', path: 'resolver'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                192, 198, 249, 112, 76, 121, 255, 180, 246, 175,
                                140, 1, 237, 62, 94, 243, 16, 224, 96, 58, 34,
                                111, 51, 89, 182, 25, 101, 198, 247, 79, 146,
                                237
                            ]
                        }
                    }
                },
                {name: 'maker', writable: true},
                {name: 'makerReceiver'},
                {name: 'srcMint', docs: ['Maker asset']},
                {name: 'dstMint', docs: ['Taker asset']},
                {
                    name: 'escrow',
                    docs: [
                        'PDA derived from order details, acting as the authority for the escrow ATA'
                    ]
                },
                {
                    name: 'escrowSrcAta',
                    docs: ['ATA of src_mint to store escrowed tokens'],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {kind: 'account', path: 'srcTokenProgram'},
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
                    optional: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'maker'},
                            {kind: 'account', path: 'srcTokenProgram'},
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
                {name: 'srcTokenProgram'},
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                },
                {name: 'protocolDstAcc', optional: true},
                {name: 'integratorDstAcc', optional: true}
            ],
            args: [
                {name: 'order', type: {defined: {name: 'orderConfig'}}},
                {name: 'rewardLimit', type: 'u64'}
            ]
        },
        {
            name: 'create',
            discriminator: [24, 30, 200, 40, 5, 28, 7, 119],
            accounts: [
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                },
                {
                    name: 'escrow',
                    docs: [
                        'PDA derived from order details, acting as the authority for the escrow ATA'
                    ]
                },
                {name: 'srcMint', docs: ['Source asset']},
                {name: 'srcTokenProgram'},
                {
                    name: 'escrowSrcAta',
                    docs: ['ATA of src_mint to store escrowed tokens'],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {kind: 'account', path: 'srcTokenProgram'},
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
                    name: 'maker',
                    docs: [
                        '`maker`, who is willing to sell src token for dst token'
                    ],
                    writable: true,
                    signer: true
                },
                {
                    name: 'makerSrcAta',
                    docs: ["Maker's ATA of src_mint"],
                    writable: true,
                    optional: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'maker'},
                            {kind: 'account', path: 'srcTokenProgram'},
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
                {name: 'dstMint', docs: ['Destination asset']},
                {name: 'makerReceiver'},
                {
                    name: 'associatedTokenProgram',
                    address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
                },
                {name: 'protocolDstAcc', optional: true},
                {name: 'integratorDstAcc', optional: true}
            ],
            args: [{name: 'order', type: {defined: {name: 'orderConfig'}}}]
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
                                192, 198, 249, 112, 76, 121, 255, 180, 246, 175,
                                140, 1, 237, 62, 94, 243, 16, 224, 96, 58, 34,
                                111, 51, 89, 182, 25, 101, 198, 247, 79, 146,
                                237
                            ]
                        }
                    }
                },
                {name: 'maker', writable: true},
                {name: 'makerReceiver', writable: true},
                {name: 'srcMint', docs: ['Maker asset']},
                {name: 'dstMint', docs: ['Taker asset']},
                {
                    name: 'escrow',
                    docs: [
                        'PDA derived from order details, acting as the authority for the escrow ATA'
                    ]
                },
                {
                    name: 'escrowSrcAta',
                    docs: ['ATA of src_mint to store escrowed tokens'],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {kind: 'account', path: 'srcTokenProgram'},
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
                    name: 'takerSrcAta',
                    docs: ["Taker's ATA of src_mint"],
                    writable: true
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
                },
                {
                    name: 'makerDstAta',
                    docs: ["Maker's ATA of dst_mint"],
                    writable: true,
                    optional: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'makerReceiver'},
                            {kind: 'account', path: 'dstTokenProgram'},
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
                {
                    name: 'takerDstAta',
                    docs: ["Taker's ATA of dst_mint"],
                    writable: true,
                    optional: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'taker'},
                            {kind: 'account', path: 'dstTokenProgram'},
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
                {name: 'protocolDstAcc', writable: true, optional: true},
                {name: 'integratorDstAcc', writable: true, optional: true}
            ],
            args: [
                {name: 'order', type: {defined: {name: 'orderConfig'}}},
                {name: 'amount', type: 'u64'}
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
            name: 'inconsistentNativeSrcTrait',
            msg: 'Inconsistent native src trait'
        },
        {
            code: 6001,
            name: 'inconsistentNativeDstTrait',
            msg: 'Inconsistent native dst trait'
        },
        {code: 6002, name: 'invalidAmount', msg: 'Invalid amount'},
        {code: 6003, name: 'missingMakerDstAta', msg: 'Missing maker dst ata'},
        {
            code: 6004,
            name: 'notEnoughTokensInEscrow',
            msg: 'Not enough tokens in escrow'
        },
        {code: 6005, name: 'orderExpired', msg: 'Order expired'},
        {
            code: 6006,
            name: 'invalidEstimatedTakingAmount',
            msg: 'Invalid estimated taking amount'
        },
        {
            code: 6007,
            name: 'invalidProtocolSurplusFee',
            msg: 'Protocol surplus fee too high'
        },
        {
            code: 6008,
            name: 'inconsistentProtocolFeeConfig',
            msg: 'Inconsistent protocol fee config'
        },
        {
            code: 6009,
            name: 'inconsistentIntegratorFeeConfig',
            msg: 'Inconsistent integrator fee config'
        },
        {code: 6010, name: 'orderNotExpired', msg: 'Order not expired'},
        {
            code: 6011,
            name: 'invalidCancellationFee',
            msg: 'Invalid cancellation fee'
        },
        {
            code: 6012,
            name: 'cancelOrderByResolverIsForbidden',
            msg: 'Cancel order by resolver is forbidden'
        },
        {code: 6013, name: 'missingTakerDstAta', msg: 'Missing taker dst ata'},
        {code: 6014, name: 'missingMakerSrcAta', msg: 'Missing maker src ata'}
    ],
    types: [
        {
            name: 'auctionData',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'startTime', type: 'u32'},
                    {name: 'duration', type: 'u32'},
                    {name: 'initialRateBump', type: 'u16'},
                    {
                        name: 'pointsAndTimeDeltas',
                        type: {vec: {defined: {name: 'pointAndTimeDelta'}}}
                    }
                ]
            }
        },
        {
            name: 'feeConfig',
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
                    },
                    {
                        name: 'maxCancellationPremium',
                        docs: [
                            'Maximum cancellation premium',
                            'Value in absolute lamports amount'
                        ],
                        type: 'u64'
                    }
                ]
            }
        },
        {
            name: 'orderConfig',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'id', type: 'u32'},
                    {name: 'srcAmount', type: 'u64'},
                    {name: 'minDstAmount', type: 'u64'},
                    {name: 'estimatedDstAmount', type: 'u64'},
                    {name: 'expirationTime', type: 'u32'},
                    {name: 'srcAssetIsNative', type: 'bool'},
                    {name: 'dstAssetIsNative', type: 'bool'},
                    {name: 'fee', type: {defined: {name: 'feeConfig'}}},
                    {
                        name: 'dutchAuctionData',
                        type: {defined: {name: 'auctionData'}}
                    },
                    {name: 'cancellationAuctionDuration', type: 'u32'}
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
            name: 'resolverAccess',
            type: {kind: 'struct', fields: [{name: 'bump', type: 'u8'}]}
        }
    ]
} as const
export const IDL: WritableDeep<typeof _IDL> = _IDL as WritableDeep<typeof _IDL>
