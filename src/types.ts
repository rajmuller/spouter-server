import { Connection, EntityManager, IDatabaseDriver } from "@mikro-orm/core";

export type MyContext = {
  // eslint-disable-next-line
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
};
