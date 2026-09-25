// Node globals that @solana/web3.js and @coral-xyz/anchor expect in the browser.
// Imported first from main.tsx so they exist before any library module evaluates.
import { Buffer } from 'buffer'

const g = globalThis as unknown as { Buffer?: typeof Buffer; global?: unknown; process?: unknown }
if (!g.Buffer) g.Buffer = Buffer
if (!g.global) g.global = globalThis
if (!g.process) g.process = { env: {} }
