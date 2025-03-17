import {WritableDeep} from 'type-fest'

const _IDL = {
    address: 'DyXFcRxGWFoMz1j76SeMXHjQqZKudLXeJY3h1K7BNJiQ',
    metadata: {
        name: 'whitelist',
        version: '0.1.0',
        spec: '0.1.0',
        description: 'Created with Anchor'
    },
    docs: ['Program for managing whitelisted users for the Fusion Swap'],
    instructions: [
        {
            name: 'deregister',
            docs: ['Removes a user from the whitelist'],
            discriminator: [161, 178, 39, 189, 231, 224, 13, 187],
            accounts: [
                {name: 'owner', writable: true, signer: true},
                {
                    name: 'whitelistState',
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    119, 104, 105, 116, 101, 108, 105, 115, 116,
                                    95, 115, 116, 97, 116, 101
                                ]
                            }
                        ]
                    }
                },
                {
                    name: 'resolverAccess',
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    114, 101, 115, 111, 108, 118, 101, 114, 95,
                                    97, 99, 99, 101, 115, 115
                                ]
                            },
                            {kind: 'arg', path: 'user'}
                        ]
                    }
                },
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: [{name: 'user', type: 'pubkey'}]
        },
        {
            name: 'initialize',
            docs: ['Initializes the whitelist with the owner'],
            discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
            accounts: [
                {name: 'owner', writable: true, signer: true},
                {
                    name: 'whitelistState',
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    119, 104, 105, 116, 101, 108, 105, 115, 116,
                                    95, 115, 116, 97, 116, 101
                                ]
                            }
                        ]
                    }
                },
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: []
        },
        {
            name: 'register',
            docs: ['Registers a new user to the whitelist'],
            discriminator: [211, 124, 67, 15, 211, 194, 178, 240],
            accounts: [
                {name: 'owner', writable: true, signer: true},
                {
                    name: 'whitelistState',
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    119, 104, 105, 116, 101, 108, 105, 115, 116,
                                    95, 115, 116, 97, 116, 101
                                ]
                            }
                        ]
                    }
                },
                {
                    name: 'resolverAccess',
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    114, 101, 115, 111, 108, 118, 101, 114, 95,
                                    97, 99, 99, 101, 115, 115
                                ]
                            },
                            {kind: 'arg', path: 'user'}
                        ]
                    }
                },
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: [{name: 'user', type: 'pubkey'}]
        },
        {
            name: 'transferOwnership',
            docs: ['Transfers ownership of the whitelist to a new owner'],
            discriminator: [65, 177, 215, 73, 53, 45, 99, 47],
            accounts: [
                {name: 'currentOwner', writable: true, signer: true},
                {
                    name: 'whitelistState',
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    119, 104, 105, 116, 101, 108, 105, 115, 116,
                                    95, 115, 116, 97, 116, 101
                                ]
                            }
                        ]
                    }
                }
            ],
            args: [{name: 'newOwner', type: 'pubkey'}]
        }
    ],
    accounts: [
        {
            name: 'resolverAccess',
            discriminator: [32, 2, 74, 248, 174, 108, 70, 156]
        },
        {
            name: 'whitelistState',
            discriminator: [246, 118, 44, 60, 71, 37, 201, 55]
        }
    ],
    errors: [
        {code: 6000, name: 'unauthorizedOwner', msg: 'Unauthorized owner'}
    ],
    types: [
        {name: 'resolverAccess', type: {kind: 'struct', fields: []}},
        {
            name: 'whitelistState',
            type: {kind: 'struct', fields: [{name: 'owner', type: 'pubkey'}]}
        }
    ]
} as const
export const IDL: WritableDeep<typeof _IDL> = _IDL as WritableDeep<typeof _IDL>
