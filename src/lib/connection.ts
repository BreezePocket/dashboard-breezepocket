import { Connection } from '@solana/web3.js'
import { RPC_URL, WS_URL } from './config'

/** One RPC connection for the whole app: chain reads, broadcasts and confirmations. */
const connection = new Connection(RPC_URL, { commitment: 'confirmed', wsEndpoint: WS_URL })
const value = { connection }

export const useConnection = () => value
