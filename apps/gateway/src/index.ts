import { Hono } from "hono";
import { proxy } from 'hono/proxy';

const app = new Hono()

const SERVICES = {
  AUTH: Bun.env.AUTH_URL || 'http://localhost:4000',
}

app.all('/api/auth/*', async (c) => {
  const res = await proxy(`${SERVICES.AUTH}${c.req.path}`, {
    headers: {
      ...c.req.header(),
      "X-Forwarded-Host": c.req.header("host"),
    }
  })

  return res
})

export default {
  port: Bun.env.GATEWAY_PORT || 3000,
  fetch: app.fetch
}

