import { MikroORM } from "@mikro-orm/core";

import mikroOrmConfig from "./mikro-orm.config";
import { Post } from "./entities/Post";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);

  const post = orm.em.create(Post, { title: "my first title" });
  await orm.em.persistAndFlush(post);
};

main();
