import { pipeline } from "node:stream/promises";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import fastifyMultipart from "@fastify/multipart";
import { authHandler } from "../hooks/auth.js";
const createUserSchema = {
  body: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      password: { type: "string" },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        id: {
          type: "string",
        },
      },
    },
  },
};

async function userRouter(fastify, options) {
  fastify.register(fastifyMultipart, {
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 100, // Max field value size in bytes
      fields: 10, // Max number of non-file fields
      fileSize: 1000000, // For multipart forms, the max file size in bytes
      files: 1, // Max number of file fields
      headerPairs: 2000, // Max number of header key=>value pairs
      parts: 1000, // For multipart forms, the max number of parts (fields + files)
    },
  });
  // create user
  fastify.post(
    "/api/user",
    { schema: createUserSchema },
    async (request, reply) => {
      const { name, email, password } = request.body;
      const userCollection = fastify.mongo.db.collection("users");
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);

      const result = await userCollection.insertOne({
        name,
        email,
        password: hash,
      });
      const insertedId = result.insertedId;

      fastify.log.info(`User created!! ${insertedId}`);

      reply.code(201);
      return {
        id: insertedId,
      };
    }
  );
  // users List
  fastify.get("/api/users", async (request, reply) => {
    const { q } = request.query;
    console.log("query", request.query);

    const userCollection = fastify.mongo.db.collection("users");
    let query = {};
    if (q) {
      query = {
        name: { $regex: q, $options: "i" }, // i -> for case insensitive
      };
    }
    const user = await userCollection.find(query).toArray();
    console.log("User List retuern");
    return user;
  });

  // single users
  fastify.get(
    "/api/users/:id",
    { preHandler: authHandler },
    async (request, reply) => {
      const id = new fastify.mongo.ObjectId(request.params.id);
      const userCollection = fastify.mongo.db.collection("users");
      const user = await userCollection.findOne({ _id: id });
      return user;
    }
  );

  // upload files
  fastify.post("/api/upload", async (request, reply) => {
    const data = await request.file();
    await pipeline(data.file, fs.createWriteStream(`static/${data.filename}`));
    reply.send();
  });
}
export default userRouter;
