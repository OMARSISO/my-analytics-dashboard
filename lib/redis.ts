import { createClient, type RedisClientType } from "redis"

let client: RedisClientType | null = null
let connectionPromise: Promise<RedisClientType | null> | null = null

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (client && client.isOpen) {
    console.log("Redis: Возвращаем существующий открытый клиент.")
    return client
  }

  if (connectionPromise) {
    console.log("Redis: Ожидаем существующее обещание подключения.")
    return connectionPromise
  }

  if (!process.env.REDIS_URL) {
    console.warn("Redis: REDIS_URL не установлен. Используется резервное хранилище в памяти.")
    return null
  }

  connectionPromise = new Promise(async (resolve) => {
    console.log("Redis: Начинаем новую попытку подключения.")
    try {
      const newClient = createClient({
        url: process.env.REDIS_URL,
      })

      newClient.on("error", (err) => {
        console.error("Ошибка клиента Redis:", err)
        client = null
        connectionPromise = null
      })

      await newClient.connect()
      console.log("Redis: Подключение успешно.")
      client = newClient
      resolve(client)
    } catch (err) {
      console.error("Redis: Не удалось подключиться.", err)
      client = null
      connectionPromise = null
      resolve(null)
    }
  })

  return connectionPromise
}
