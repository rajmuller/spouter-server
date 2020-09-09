import "reflect-metadata";
import express from "express";
import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";

import { PostResolver, UserResolver } from "./resolvers";
import mikroOrmConfig from "./mikro-orm.config";
import { __prod__ } from "./constants";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();
  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    cors({
      // TODO: env variable
      origin: "http://localhost:7777",
      credentials: true,
    })
  );

  app.use(
    session({
      name: "qid",
      store: new RedisStore({ client: redisClient }),
      // TODO: change this
      secret: "TODO please change me later to env var",
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // CSRF
        secure: __prod__, // cookie only works in https
      },
      saveUninitialized: false,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(4000, () => {
    // eslint-disable-next-line no-console
    console.log("server started on localhost:4000: ");
  });
};

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.log("ERROR: ", e);
});
