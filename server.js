import Fastify from "fastify";
import fastifyMongodb from "@fastify/mongodb";
import userRouter from "./src/routes/user.js";

const fastify = Fastify({
  logger: true,
});

// database connection
fastify.register(fastifyMongodb, {
  forceClose: true,
  url: process.env.DB_URL,
});

fastify.register(userRouter);
fastify.get("/", (req, reply) => {
  return {
    message: "Welcome to the API",
  };
});

const start = async () => {
  const PORT = process.env.PORT || 3000;
  try {
    await fastify.listen({ port: PORT });
    console.log(`server listening on ${PORT}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
