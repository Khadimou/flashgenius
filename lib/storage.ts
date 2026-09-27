import type { Subscriber } from "./types"
import fs from "fs"
import path from "path"

const DEV_FILE = path.join(process.cwd(), "data", "subscribers.json")

function readFile(): Record<string, Subscriber> {
  try {
    if (!fs.existsSync(DEV_FILE)) return {}
    return JSON.parse(fs.readFileSync(DEV_FILE, "utf-8"))
  } catch { return {} }
}
function writeFile(data: Record<string, Subscriber>) {
  try {
    fs.mkdirSync(path.dirname(DEV_FILE), { recursive: true })
    fs.writeFileSync(DEV_FILE, JSON.stringify(data, null, 2), "utf-8")
  } catch (e) { console.warn("[storage] write failed:", e) }
}

async function getKV() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import("@vercel/kv")
    return kv
  }
  return null
}

export async function addSubscriber(sub: Subscriber): Promise<void> {
  const kv = await getKV()
  if (kv) {
    await kv.hset("fg:subscribers", { [sub.id]: JSON.stringify(sub) })
    await kv.incr("fg:count")
  } else {
    const store = readFile()
    store[sub.id] = sub
    writeFile(store)
  }
}

export async function getSubscribers(): Promise<Subscriber[]> {
  const kv = await getKV()
  if (kv) {
    const data = await kv.hgetall("fg:subscribers")
    if (!data) return []
    return Object.values(data).map((v) => typeof v === "string" ? JSON.parse(v) : v as Subscriber)
  }
  return Object.values(readFile())
}

export async function updateSubscriber(id: string, updates: Partial<Subscriber>): Promise<void> {
  const kv = await getKV()
  if (kv) {
    const raw = await kv.hget("fg:subscribers", id)
    const existing = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : {}
    await kv.hset("fg:subscribers", { [id]: JSON.stringify({ ...existing, ...updates }) })
  } else {
    const store = readFile()
    if (store[id]) { store[id] = { ...store[id], ...updates }; writeFile(store) }
  }
}

export async function getSubscriberCount(): Promise<number> {
  const kv = await getKV()
  if (kv) {
    const n = await kv.get<number>("fg:count")
    return n ?? (await getSubscribers()).length
  }
  return Object.keys(readFile()).length
}

export async function emailExists(email: string): Promise<boolean> {
  return (await getSubscribers()).some((s) => s.email.toLowerCase() === email.toLowerCase())
}
