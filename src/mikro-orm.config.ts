import { MikroORM } from "@mikro-orm/core";
import path from "path";

import { Post, User } from "./entities";
import { __prod__ } from "./constants";

const mikroOrmConfig = {
  migrations: {
    path: path.join(__dirname, "./migrations"), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[jt]s$/, // regex pattern for the migration files
  },
  dbName: "spouter",
  entities: [Post, User],
  user: "rrated",
  password: "Dead7Field",
  type: "postgresql",
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];

export default mikroOrmConfig;
