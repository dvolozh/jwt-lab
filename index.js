require("dotenv").config();
require("./config/database").connect()
const fastify = require('fastify')({
  logger: true
})
const User = require("./model/user")

fastify.register(require('fastify-jwt'), {
  secret: 'supersecret'
})


fastify.decorate("authenticate", async function(req, res) {
  try {
    await req.jwtVerify()
  } catch (err) {
    res.send(err)
  }
})

/*fastify.route({
  method: 'GET',
  url: '/index',
  prehandler: [fastify.authenticate],
  handler: function (req, res) {
    res.send(`Hello, ${req.user}`)
  }
})  THIS ONE DOESN'T WORK????*/

fastify.get(
  "/index",
  {
    preValidation: [fastify.authenticate]
  },
  async function(request, reply) {
    reply.send(request.user)
  }
)

fastify.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send("All input is required");
    }

    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exists. Please Login");
    }

    const user = await User.create({
      email: email,
      password: password,
    });

    const token = fastify.jwt.sign({
      email: email
    })

    res.status(201).send(token);
  } catch (err) {
    console.log(err);
  }
})

fastify.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send("All input is required");
    }

    const user = await User.findOne({ email });

    if (user && user.password == password) {
      const token = fastify.jwt.sign({
        email: email
      })

      res.status(200).send(token);
    }
    res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
  }
})

const start = async () => {
  try {
    await fastify.listen(process.env.port)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
