import { Hono } from 'hono'
import { decode, sign, verify } from 'hono/jwt'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { JsonArray } from '@prisma/client/runtime/library';

const app = new Hono<{
	Bindings: {
		DATABASE_URL: string,
    JWT_SECRET: string
  	}
}>();

// top-level middleware initialization
app.use('/api/v1/blog/*', async (c, next) => {
  // get the header
  // verify the header 
  // if the header is correct, send status  200 and proceed 
  // if not we return the user a 403 status code 
  const header = c.req.header("authorization") || "";

  const token = header.split(" ")[1]
  const response = await verify(token, c.env.JWT_SECRET)

  if (response.id){
    next()
  }
  else{
    c.status(403)
    return c.json({ error: "unauthorized!" })
  }
  await next()
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
})


app.post('/api/v1/signup', async (c) => {

  // 1. prisma initialization
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate());

  // 2. parse the body from user into json
	const body = await c.req.json();

  // 3. create the user
	try {
		const user = await prisma.user.create({
			data: {
        name: body.name,
				email: body.email,
				password: body.password
			}
		});
    const token = await sign({id: user.id},c.env.JWT_SECRET)
    // 4. return a jwt for user signup
		return c.json({
      jwt: token
    })
	} 
  // 5. return 403 for any error
  catch(e) {
		return c.status(403);
	}
})


app.post('/api/v1/signin', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const user = await prisma.user.findUnique({
		where: {
			email: body.email,
      password: body.password
		}
	});

	if (!user) {
		c.status(403);
		return c.json({ error: "user not found" });
	}

	const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
	return c.json({ jwt });
})


app.post('/api/v1/blog', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/v1/blog/:id', (c) => {
  return c.text('Hello Hono!')
})

app.put('/api/v1/blog', (c) => {
  return c.text('Hello Hono!')
})

app.delete('/api/v1/blog', (c) => {
  return c.text('Hello Hono!')
})
export default app
