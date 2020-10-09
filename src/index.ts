import "reflect-metadata";
import express from "express";
import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";

import { postResolver, userResolver } from "./resolvers";
import mikroOrmConfig from "./mikro-orm.config";
import { PRODUCTION, COOKIE_NAME } from "./constants";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();
  const RedisStore = connectRedis(session);
  const redis = Redis();

  app.use(
    cors({
      // TODO: env variable
      origin: "http://localhost:7777",
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis }),
      // TODO: change this
      secret: "TODO please change me later to env var",
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // CSRF
        secure: PRODUCTION, // cookie only works in https
      },
      saveUninitialized: false,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [postResolver, userResolver],
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
