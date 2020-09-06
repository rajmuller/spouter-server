import "reflect-metadata";
import express from "express";
import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import mikroOrmConfig from "./mikro-orm.config";
import { PostResolver, UserResolver } from "./resolvers";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: () => ({ em: orm.em }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    // eslint-disable-next-line no-console
    console.log("server started on localhost:4000: ");
  });
};

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.log("ERROR: ", e);
});
