/**
 * Browser client for the breezepocket Anchor program on devnet: PDAs, the
 * open_position / open_asset_position transaction the desk co-signs, settle, and
 * account reads. SOL positions hold lamports; every other asset is an SPL token
 * governance listed on chain, and its positions hold both legs as tokens.
 * Mirrors MM-system-breezepocket/src/program.js so the desk's byte-for-byte
 * verification of the transaction passes.
 */
import { AnchorProvider, BN, Program, type Idl } from '@coral-xyz/anchor'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { type Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { Buffer } from 'buffer'
import idlJson from '../idl/breezepocket.json'
import type { Breezepocket } from '../idl/breezepocket'
import type { Product } from './mm'

export const IDL = idlJson as unknown as Breezepocket
export const PROGRAM_ID = new PublicKey((idlJson as { address: string }).address)
export const CONFIG_PDA = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID)[0]

export const LAMPORTS_PER_SOL = 1_000_000_000n
export const USDC_BASE = 1_000_000n
export const DISPUTE_WINDOW_SECS = 30 * 60

const PRODUCT_ENUM: Record<Product, object> = { sell_sol: { sellSol: {} }, buy_sol: { buySol: {} } }

export type PositionRow = {
  address: PublicKey
  user: PublicKey
  marketMaker: PublicKey
  /** null for SOL; the listed SPL mint otherwise. */
  assetMint: PublicKey | null
  /** 'SOL', or the listed asset's symbol. */
  symbol: string
  /** Decimals of the asset leg: 9 for SOL. */
  decimals: number
  product: Product
  fixedPrice: bigint
  expiryTs: number
  userCollateral: bigint
  mmCollateral: bigint
  yieldAmount: bigint
  nonce: bigint
  settled: boolean
}
export type SettlementPriceRow = { price: bigint; postedTs: number; source: 'poster' | 'governance' }
export type GlobalConfigRow = { usdcMint: PublicKey; pricePoster: PublicKey; governanceKeys: PublicKey[] }
export type ListedAsset = { mint: PublicKey; symbol: string; decimals: number; expiryTimeOfDay: number }

const u64le = (n: bigint) => {
  const b = new Uint8Array(8)
  new DataView(b.buffer).setBigUint64(0, n, true)
  return b
}
const i64le = (n: number | bigint) => {
  const b = new Uint8Array(8)
  new DataView(b.buffer).setBigInt64(0, BigInt(n), true)
  return b
}

/** Read-only provider: account reads and instruction building never sign here. */
const readOnlyWallet = {
  publicKey: PublicKey.default,
  signTransaction: async <T,>(t: T) => t,
  signAllTransactions: async <T,>(t: T[]) => t,
}

const programs = new WeakMap<Connection, Program<Breezepocket>>()
export function getProgram(connection: Connection): Program<Breezepocket> {
  let p = programs.get(connection)
  if (!p) {
    const provider = new AnchorProvider(connection, readOnlyWallet, { commitment: 'confirmed' })
    p = new Program<Breezepocket>(IDL as unknown as Idl as Breezepocket, provider)
    programs.set(connection, p)
  }
  return p
}

export const positionPda = (user: PublicKey, mm: PublicKey, fixedPrice: bigint, expiryTs: number, nonce: bigint) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('position'), user.toBuffer(), mm.toBuffer(), u64le(fixedPrice), i64le(expiryTs), u64le(nonce)],
    PROGRAM_ID,
  )[0]

export const assetPositionPda = (user: PublicKey, mm: PublicKey, mint: PublicKey, fixedPrice: bigint, expiryTs: number, nonce: bigint) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('asset_position'), user.toBuffer(), mm.toBuffer(), mint.toBuffer(), u64le(fixedPrice), i64le(expiryTs), u64le(nonce)],
    PROGRAM_ID,
  )[0]

export const assetPda = (mint: PublicKey) => PublicKey.findProgramAddressSync([Buffer.from('asset'), mint.toBuffer()], PROGRAM_ID)[0]

/** SOL settlement prices are keyed by the priced asset (SOL, seed byte 0) and expiry. */
export const settlementPricePda = (expiryTs: number) =>
  PublicKey.findProgramAddressSync([Buffer.from('settlement_price'), Uint8Array.from([0]), i64le(expiryTs)], PROGRAM_ID)[0]

/** A listed asset's settlement price, keyed by its mint and expiry. */
export const assetPricePda = (mint: PublicKey, expiryTs: number) =>
  PublicKey.findProgramAddressSync([Buffer.from('asset_price'), mint.toBuffer(), i64le(expiryTs)], PROGRAM_ID)[0]

export const ata = (mint: PublicKey, owner: PublicKey) => getAssociatedTokenAddressSync(mint, owner, true)

let configCache: Promise<GlobalConfigRow> | null = null
export function fetchConfig(connection: Connection): Promise<GlobalConfigRow> {
  if (!configCache) {
    configCache = getProgram(connection)
      .account.globalConfig.fetch(CONFIG_PDA)
      .then((c) => ({ usdcMint: c.usdcMint, pricePoster: c.pricePoster, governanceKeys: c.governanceKeys }))
      .catch((e) => {
        configCache = null
        throw e
      })
  }
  return configCache
}

/** Every asset governance has listed, cached per connection for the session. */
const listingCache = new WeakMap<Connection, Promise<ListedAsset[]>>()
export function fetchListedAssets(connection: Connection): Promise<ListedAsset[]> {
  let p = listingCache.get(connection)
  if (!p) {
    p = getProgram(connection)
      .account.assetConfig.all()
      .then((rows) =>
        rows.map((r) => ({
          mint: r.account.mint,
          symbol: r.account.symbol,
          decimals: r.account.decimals,
          expiryTimeOfDay: Number(r.account.expiryTimeOfDay.toString()),
        })),
      )
      .catch((e) => {
        listingCache.delete(connection)
        throw e
      })
    listingCache.set(connection, p)
  }
  return p
}

export type OpenParams = {
  user: PublicKey
  mm: PublicKey
  usdcMint: PublicKey
  /** Set for a listed asset: opens with open_asset_position on this mint. */
  assetMint?: PublicKey | null
  product: Product
  fixedPrice: bigint
  expiryTs: number
  amount: bigint
  yieldAmount: bigint
  nonce: bigint
}

/** The position account a quote opens: SOL or listed-asset layout. */
export const openedPositionPda = (p: Pick<OpenParams, 'user' | 'mm' | 'assetMint' | 'fixedPrice' | 'expiryTs' | 'nonce'>) =>
  p.assetMint
    ? assetPositionPda(p.user, p.mm, p.assetMint, p.fixedPrice, p.expiryTs, p.nonce)
    : positionPda(p.user, p.mm, p.fixedPrice, p.expiryTs, p.nonce)

/** Unsigned open_position (SOL) or open_asset_position transaction with the market maker as fee payer. */
export async function buildOpenPositionTx(connection: Connection, p: OpenParams): Promise<Transaction> {
  const program = getProgram(connection)
  const params = {
    product: PRODUCT_ENUM[p.product] as never,
    fixedPrice: new BN(p.fixedPrice.toString()),
    expiryTs: new BN(p.expiryTs),
    amount: new BN(p.amount.toString()),
    yieldAmount: new BN(p.yieldAmount.toString()),
    nonce: new BN(p.nonce.toString()),
  }
  const position = openedPositionPda(p)
  const shared = {
    marketMaker: p.mm,
    user: p.user,
    config: CONFIG_PDA,
    position,
    usdcMint: p.usdcMint,
    positionUsdcVault: ata(p.usdcMint, position),
    userUsdcAta: ata(p.usdcMint, p.user),
    mmUsdcAta: ata(p.usdcMint, p.mm),
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  }
  const mint = p.assetMint
  const ix = mint
    ? await program.methods
        .openAssetPosition(params)
        .accountsStrict({
          ...shared,
          asset: assetPda(mint),
          assetMint: mint,
          positionAssetVault: ata(mint, position),
          userAssetAta: ata(mint, p.user),
          mmAssetAta: ata(mint, p.mm),
        })
        .instruction()
    : await program.methods.openPosition(params).accountsStrict(shared).instruction()
  const tx = new Transaction()
  tx.feePayer = p.mm
  tx.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash
  tx.add(ix)
  return tx
}

/** Permissionless settle: anyone may call once the price is posted and the dispute window has passed. */
export async function buildSettleTx(connection: Connection, caller: PublicKey, usdcMint: PublicKey, pos: PositionRow): Promise<Transaction> {
  const program = getProgram(connection)
  const shared = {
    caller,
    config: CONFIG_PDA,
    position: pos.address,
    user: pos.user,
    marketMaker: pos.marketMaker,
    usdcMint,
    positionUsdcVault: ata(usdcMint, pos.address),
    userUsdcAta: ata(usdcMint, pos.user),
    mmUsdcAta: ata(usdcMint, pos.marketMaker),
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  }
  const mint = pos.assetMint
  const tx = mint
    ? await program.methods
        .settleAssetPosition()
        .accountsStrict({
          ...shared,
          settlementPrice: assetPricePda(mint, pos.expiryTs),
          assetMint: mint,
          positionAssetVault: ata(mint, pos.address),
          userAssetAta: ata(mint, pos.user),
          mmAssetAta: ata(mint, pos.marketMaker),
        })
        .transaction()
    : await program.methods.settle().accountsStrict({ ...shared, settlementPrice: settlementPricePda(pos.expiryTs) }).transaction()
  tx.feePayer = caller
  tx.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash
  return tx
}

const USER_OFFSET = 8 // account discriminator

/** SOL and listed-asset positions for a user, soonest expiry first. */
export async function fetchPositionsForUser(connection: Connection, user: PublicKey): Promise<PositionRow[]> {
  const program = getProgram(connection)
  const filter = [{ memcmp: { offset: USER_OFFSET, bytes: user.toBase58() } }]
  const [sol, assets, listed] = await Promise.all([
    program.account.positionAccount.all(filter),
    program.account.assetPosition.all(filter),
    fetchListedAssets(connection).catch(() => [] as ListedAsset[]),
  ])
  const bySymbol = new Map(listed.map((l) => [l.mint.toBase58(), l]))
  const rows = [
    ...sol.map((r) => ({ publicKey: r.publicKey, account: { ...r.account, assetMint: null as PublicKey | null } })),
    ...assets.map((r) => ({ publicKey: r.publicKey, account: r.account as typeof r.account & { assetMint: PublicKey | null } })),
  ]
  return rows
    .map((r) => {
      const a = r.account
      const listing = a.assetMint ? bySymbol.get(a.assetMint.toBase58()) : null
      return {
        address: r.publicKey,
        user: a.user,
        marketMaker: a.marketMaker,
        assetMint: a.assetMint,
        symbol: a.assetMint ? listing?.symbol ?? `${a.assetMint.toBase58().slice(0, 4)}…` : 'SOL',
        decimals: listing?.decimals ?? 9,
        product: ('sellSol' in (a.product as object) ? 'sell_sol' : 'buy_sol') as Product,
        fixedPrice: BigInt(a.fixedPrice.toString()),
        expiryTs: Number(a.expiryTs.toString()),
        userCollateral: BigInt(a.userCollateral.toString()),
        mmCollateral: BigInt(a.mmCollateral.toString()),
        yieldAmount: BigInt(a.yieldAmount.toString()),
        nonce: BigInt(a.nonce.toString()),
        settled: a.settled,
      }
    })
    .sort((x, y) => x.expiryTs - y.expiryTs)
}

/** The posted price for SOL at an expiry, or for a listed asset when `mint` is given. */
export async function fetchSettlementPrice(connection: Connection, expiryTs: number, mint?: PublicKey | null): Promise<SettlementPriceRow | null> {
  const program = getProgram(connection)
  const acc = mint
    ? await program.account.assetSettlementPrice.fetchNullable(assetPricePda(mint, expiryTs))
    : await program.account.settlementPrice.fetchNullable(settlementPricePda(expiryTs))
  if (!acc) return null
  return {
    price: BigInt(acc.price.toString()),
    postedTs: Number(acc.postedTs.toString()),
    source: 'poster' in (acc.source as object) ? 'poster' : 'governance',
  }
}

/** The exchange happens (sold / bought) when the settlement price crosses the fixed price. */
export const exchangeHappens = (product: Product, settlement: bigint, fixed: bigint) =>
  product === 'sell_sol' ? settlement >= fixed : settlement <= fixed

/** Settlement prices are per asset and expiry; this is the key usePositions stores them under. */
export const priceKey = (p: Pick<PositionRow, 'assetMint' | 'expiryTs'>) => `${p.assetMint?.toBase58() ?? 'SOL'}:${p.expiryTs}`

/** Human-readable conversions. */
export const toUnits = (n: bigint, decimals: number) => Number(n) / 10 ** decimals
export const fromUnits = (x: number, decimals: number) => BigInt(Math.round(x * 10 ** decimals))
export const lamportsToSol = (n: bigint) => Number(n) / 1e9
export const baseToUsdc = (n: bigint) => Number(n) / 1e6
export const solToLamports = (sol: number) => BigInt(Math.round(sol * 1e9))
export const usdcToBase = (usdc: number) => BigInt(Math.round(usdc * 1e6))
export const priceToBase = (price: number) => BigInt(Math.round(price * 1e6))
