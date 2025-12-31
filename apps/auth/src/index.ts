import { Hono } from 'hono'
import { auth } from './lib/auth';

const app = new Hono()

app.get('/', (c) => c.text('Hono!'))

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

export default {
  port: Bun.env.AUTH_PORT || 4000,
  fetch: app.fetch
}

