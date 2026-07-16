import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import type { Inventory, Party } from '@/types';
import { STARTER_INVENTORY, STARTING_AEONS } from '@/constants';

/**
 * Test-server account store — an in-memory Map flushed to a local JSON file,
 * not a real database. That's the right call for a 5-person test rig: no
 * infra to stand up, survives a server restart, and the whole dataset is a
 * handful of KB. Passwords are bcrypt-hashed (cheap to add, no reason not to)
 * even though this is throwaway test data.
 */

export interface ServerAccount {
  passwordHash: string;
  party: Party | null;
  inventory: Inventory;
  aeons: number;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'accounts.json');

const accounts = new Map<string, ServerAccount>();

export async function loadAccounts(): Promise<void> {
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, ServerAccount>;
    Object.entries(parsed).forEach(([username, acc]) => accounts.set(username, acc));
    console.log(`[accounts] loaded ${accounts.size} account(s) from ${DATA_FILE}`);
  } catch {
    console.log('[accounts] no existing accounts.json — starting fresh');
  }
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    await mkdir(DATA_DIR, { recursive: true });
    const obj = Object.fromEntries(accounts);
    await writeFile(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  }, 1000);
}

export async function registerAccount(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = username.trim();
  if (!name || !password) return { ok: false, error: 'Enter a mage name and password.' };
  if (accounts.has(name)) return { ok: false, error: 'That mage name is taken. Try logging in.' };
  const passwordHash = await bcrypt.hash(password, 10);
  accounts.set(name, { passwordHash, party: null, inventory: { ...STARTER_INVENTORY }, aeons: STARTING_AEONS });
  scheduleFlush();
  return { ok: true };
}

export async function loginAccount(username: string, password: string): Promise<{ ok: true; account: ServerAccount } | { ok: false; error: string }> {
  const name = username.trim();
  const acc = accounts.get(name);
  if (!acc) return { ok: false, error: 'Wrong mage name or password.' };
  const matches = await bcrypt.compare(password, acc.passwordHash);
  if (!matches) return { ok: false, error: 'Wrong mage name or password.' };
  return { ok: true, account: acc };
}

export function saveAccountData(username: string, data: { party: Party | null; inventory: Inventory; aeons: number }): boolean {
  const acc = accounts.get(username);
  if (!acc) return false;
  acc.party = data.party;
  acc.inventory = data.inventory;
  acc.aeons = data.aeons;
  scheduleFlush();
  return true;
}
