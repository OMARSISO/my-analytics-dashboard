import { createClient, type RedisClientType } from "redis"

let client: RedisClientType | null = null
let connectionPromise: Promise<RedisClientType | null> | null = null

// Эта функция гарантирует, что мы пытаемся подключиться только один раз,
// даже при одновременных запросах, и корректно обрабатывает ошибки.
export async function getRedisClient(): Promise<RedisClientType | null> {
  // Если клиент уже подключен, возвращаем его.
  if (client && client.isOpen) {
    return client
  }

  // Если попытка подключения уже в процессе, ждем ее завершения.
  if (connectionPromise) {
    return connectionPromise
  }

  // Если REDIS_URL не установлен, мы не можем подключиться.
  if (!process.env.REDIS_URL) {
    console.warn("REDIS_URL не установлен. Аналитика будет использовать временное хранилище.")
    return null
  }

  // Начинаем новую попытку подключения.
  connectionPromise = new Promise(async (resolve) => {
    try {
      console.log("Создание нового клиента Redis...")
      const newClient = createClient({
        url: process.env.REDIS_URL,
      })

      newClient.on("error", (err) => {
        console.error("Ошибка клиента Redis:", err)
        // При ошибке сбрасываем состояние, чтобы можно было попробовать снова.
        client = null
        connectionPromise = null
      })

      await newClient.connect()
      console.log("Клиент Redis успешно подключен.")
      client = newClient
      resolve(client)
    } catch (err) {
      console.error("Не удалось подключиться к Redis:", err)
      // При сбое сбрасываем состояние и возвращаем null, чтобы приложение
      // могло использовать резервный вариант, а не падать.
      client = null
      connectionPromise = null
      resolve(null)
    }
  })

  return connectionPromise
}
