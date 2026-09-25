/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/breezepocket.json`.
 */
export type Breezepocket = {
  "address": "BeytdpJYSGP1oFRxEiBLkSRGuW6HW3Pk9dqSZCuSteQ9",
  "metadata": {
    "name": "breezepocket",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "breezepocket: commit to sell or buy SOL at a fixed price by an expiry, earn yield upfront"
  },
  "instructions": [
    {
      "name": "emergencyCancel",
      "docs": [
        "3/5 governance: return all collateral immediately, ignoring expiry and price."
      ],
      "discriminator": [
        92,
        73,
        255,
        17,
        197,
        5,
        46,
        75
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "position.user",
                "account": "positionAccount"
              },
              {
                "kind": "account",
                "path": "position.market_maker",
                "account": "positionAccount"
              },
              {
                "kind": "account",
                "path": "position.fixed_price",
                "account": "positionAccount"
              },
              {
                "kind": "account",
                "path": "position.expiry_ts",
                "account": "positionAccount"
              },
              {
                "kind": "account",
                "path": "position.nonce",
                "account": "positionAccount"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "marketMaker",
          "writable": true
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "positionUsdcVault",
          "docs": [
            "USDC associated token account, so a settled position whose vault was closed",
            "reports `AlreadySettled` rather than a deserialization error."
          ],
          "writable": true
        },
        {
          "name": "userUsdcAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "mmUsdcAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "marketMaker"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeConfig",
      "docs": [
        "One-time setup of the governance list, price poster and USDC mint."
      ],
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "usdcMint",
          "docs": [
            "USDC mint used by every position on this deployment."
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "initializeConfigParams"
            }
          }
        }
      ]
    },
    {
      "name": "openPosition",
      "docs": [
        "Lock user collateral and the market maker's counter-leg atomically and pay",
        "the yield to the user upfront. Requires both the user and MM signatures;",
        "the MM is the fee payer."
      ],
      "discriminator": [
        135,
        128,
        47,
        77,
        15,
        152,
        240,
        49
      ],
      "accounts": [
        {
          "name": "marketMaker",
          "docs": [
            "Fee payer, rent payer, co-signer, and source of MM collateral and yield."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "marketMaker"
              },
              {
                "kind": "arg",
                "path": "params.fixed_price"
              },
              {
                "kind": "arg",
                "path": "params.expiry_ts"
              },
              {
                "kind": "arg",
                "path": "params.nonce"
              }
            ]
          }
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "positionUsdcVault",
          "docs": [
            "Holds the USDC leg of the position until settlement."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "position"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userUsdcAta",
          "docs": [
            "Created by the market maker if the user has no USDC account yet, so that",
            "settlement can always pay the user in USDC."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "mmUsdcAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "marketMaker"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "openParams"
            }
          }
        }
      ]
    },
    {
      "name": "overrideSettlementPrice",
      "docs": [
        "3/5 governance: set or replace the settlement price with no dispute window."
      ],
      "discriminator": [
        87,
        136,
        203,
        248,
        25,
        29,
        146,
        14
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Pays rent if the poster never posted. Governance signers go in `remaining_accounts`."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "settlementPrice",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "token",
          "type": {
            "defined": {
              "name": "token"
            }
          }
        },
        {
          "name": "expiryTs",
          "type": "i64"
        },
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "postSettlementPrice",
      "docs": [
        "Price poster records the Deribit delivery price for (token, expiry)."
      ],
      "discriminator": [
        42,
        208,
        212,
        3,
        171,
        63,
        11,
        245
      ],
      "accounts": [
        {
          "name": "poster",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "settlementPrice",
          "docs": [
            "One price per (token, expiry). `init` makes a second post fail."
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "token",
          "type": {
            "defined": {
              "name": "token"
            }
          }
        },
        {
          "name": "expiryTs",
          "type": "i64"
        },
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "settle",
      "docs": [
        "Permissionless settlement after expiry and the dispute window."
      ],
      "discriminator": [
        175,
        42,
        185,
        87,
        144,
        131,
        102,
        212
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Anyone. Pays the fee and, if needed, rent for missing USDC accounts."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "position.user",
                "account": "positionAccount"
              },
              {
                "kind": "account",
                "path": "position.market_maker",
                "account": "positionAccount"
              },
              {
                "kind": "account",
                "path": "position.fixed_price",
                "account": "positionAccount"
              },
              {
                "kind": "account",
                "path": "position.expiry_ts",
                "account": "positionAccount"
              },
              {
                "kind": "account",
                "path": "position.nonce",
                "account": "positionAccount"
              }
            ]
          }
        },
        {
          "name": "settlementPrice",
          "docs": [
            "`SettlementPriceMissing` instead of a generic Anchor error."
          ]
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "marketMaker",
          "writable": true
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "positionUsdcVault",
          "docs": [
            "USDC associated token account, so a settled position whose vault was closed",
            "reports `AlreadySettled` rather than a deserialization error."
          ],
          "writable": true
        },
        {
          "name": "userUsdcAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "mmUsdcAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "marketMaker"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "globalConfig",
      "discriminator": [
        149,
        8,
        156,
        202,
        160,
        252,
        176,
        217
      ]
    },
    {
      "name": "positionAccount",
      "discriminator": [
        60,
        125,
        250,
        193,
        181,
        109,
        238,
        86
      ]
    },
    {
      "name": "settlementPrice",
      "discriminator": [
        249,
        152,
        243,
        138,
        255,
        57,
        15,
        46
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "expiryInPast",
      "msg": "Expiry must be in the future"
    },
    {
      "code": 6001,
      "name": "expiryNotAligned",
      "msg": "Expiry must be exactly 08:00 UTC (Deribit delivery time)"
    },
    {
      "code": 6002,
      "name": "invalidFixedPrice",
      "msg": "Fixed price must be greater than zero"
    },
    {
      "code": 6003,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6004,
      "name": "invalidYield",
      "msg": "Yield must be greater than zero"
    },
    {
      "code": 6005,
      "name": "sameCounterparty",
      "msg": "User and market maker must be different accounts"
    },
    {
      "code": 6006,
      "name": "invalidTokenAccount",
      "msg": "Token account does not match the expected mint or owner"
    },
    {
      "code": 6007,
      "name": "invalidUsdcMint",
      "msg": "USDC mint does not match GlobalConfig"
    },
    {
      "code": 6008,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6009,
      "name": "notExpiredYet",
      "msg": "Position has not expired yet"
    },
    {
      "code": 6010,
      "name": "settlementPriceMissing",
      "msg": "No settlement price has been posted for this expiry"
    },
    {
      "code": 6011,
      "name": "settlementPriceMismatch",
      "msg": "Settlement price account does not match the expected PDA"
    },
    {
      "code": 6012,
      "name": "disputeWindowOpen",
      "msg": "Dispute window is still open for the posted settlement price"
    },
    {
      "code": 6013,
      "name": "alreadySettled",
      "msg": "Position is already settled"
    },
    {
      "code": 6014,
      "name": "unauthorizedPricePoster",
      "msg": "Only the configured price poster may post settlement prices"
    },
    {
      "code": 6015,
      "name": "insufficientGovernanceSignatures",
      "msg": "Fewer than the required number of governance keys signed"
    },
    {
      "code": 6016,
      "name": "unauthorizedGovernanceSigner",
      "msg": "A signer is not one of the governance keys"
    },
    {
      "code": 6017,
      "name": "duplicateGovernanceKey",
      "msg": "Governance keys must be distinct"
    },
    {
      "code": 6018,
      "name": "invalidVault",
      "msg": "Position vault does not belong to this position"
    },
    {
      "code": 6019,
      "name": "invalidCounterparty",
      "msg": "Account does not match the position's user or market maker"
    }
  ],
  "types": [
    {
      "name": "globalConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "governanceKeys",
            "docs": [
              "3/5 multisig authority list."
            ],
            "type": {
              "array": [
                "pubkey",
                5
              ]
            }
          },
          {
            "name": "requiredSignatures",
            "docs": [
              "Always 3."
            ],
            "type": "u8"
          },
          {
            "name": "pricePoster",
            "docs": [
              "Key allowed to post Deribit delivery prices."
            ],
            "type": "pubkey"
          },
          {
            "name": "usdcMint",
            "docs": [
              "USDC mint accepted as Buy SOL collateral and as the Sell SOL payment leg."
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "initializeConfigParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "governanceKeys",
            "type": {
              "array": [
                "pubkey",
                5
              ]
            }
          },
          {
            "name": "pricePoster",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "openParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "product",
            "type": {
              "defined": {
                "name": "product"
              }
            }
          },
          {
            "name": "fixedPrice",
            "docs": [
              "USDC base units per SOL."
            ],
            "type": "u64"
          },
          {
            "name": "expiryTs",
            "docs": [
              "Must be 08:00 UTC on a future date."
            ],
            "type": "i64"
          },
          {
            "name": "amount",
            "docs": [
              "User collateral in base units of the product's collateral token."
            ],
            "type": "u64"
          },
          {
            "name": "yieldAmount",
            "docs": [
              "Yield paid upfront to the user, in the same token as the collateral."
            ],
            "type": "u64"
          },
          {
            "name": "nonce",
            "docs": [
              "Random per-quote value; part of the PDA seed so a quote can only be used once."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "positionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "marketMaker",
            "type": "pubkey"
          },
          {
            "name": "product",
            "type": {
              "defined": {
                "name": "product"
              }
            }
          },
          {
            "name": "token",
            "docs": [
              "Token the user locked as collateral."
            ],
            "type": {
              "defined": {
                "name": "token"
              }
            }
          },
          {
            "name": "fixedPrice",
            "docs": [
              "USDC base units per SOL."
            ],
            "type": "u64"
          },
          {
            "name": "expiryTs",
            "docs": [
              "Unix timestamp, must be 08:00 UTC."
            ],
            "type": "i64"
          },
          {
            "name": "userCollateral",
            "docs": [
              "User collateral in base units of `token`. SOL lamports live on this account;",
              "USDC lives in the position's vault token account."
            ],
            "type": "u64"
          },
          {
            "name": "mmCollateral",
            "docs": [
              "The other leg of the exchange, posted by the market maker: USDC for Sell SOL,",
              "SOL lamports for Buy SOL."
            ],
            "type": "u64"
          },
          {
            "name": "yieldAmount",
            "docs": [
              "Paid to the user upfront in `token` base units."
            ],
            "type": "u64"
          },
          {
            "name": "nonce",
            "docs": [
              "Replay protection; part of the PDA seed."
            ],
            "type": "u64"
          },
          {
            "name": "settled",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "priceSource",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "poster"
          },
          {
            "name": "governance"
          }
        ]
      }
    },
    {
      "name": "product",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "sellSol"
          },
          {
            "name": "buySol"
          }
        ]
      }
    },
    {
      "name": "settlementPrice",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "token",
            "docs": [
              "Asset that was priced (SOL for every v1 product)."
            ],
            "type": {
              "defined": {
                "name": "token"
              }
            }
          },
          {
            "name": "expiryTs",
            "docs": [
              "08:00 UTC on the expiry date."
            ],
            "type": "i64"
          },
          {
            "name": "price",
            "docs": [
              "USDC base units per token; the Deribit delivery price."
            ],
            "type": "u64"
          },
          {
            "name": "postedTs",
            "docs": [
              "When the price was posted; the dispute window starts here."
            ],
            "type": "i64"
          },
          {
            "name": "source",
            "type": {
              "defined": {
                "name": "priceSource"
              }
            }
          },
          {
            "name": "approvals",
            "docs": [
              "Governance override approvals, indexed like `GlobalConfig.governance_keys`."
            ],
            "type": {
              "array": [
                "bool",
                5
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "token",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "sol"
          },
          {
            "name": "usdc"
          }
        ]
      }
    }
  ]
};
