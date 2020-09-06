import { Migration } from "@mikro-orm/migrations";

// eslint-disable-next-line import/prefer-default-export
export class Migration20200905194107 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "post" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" text not null);'
    );
  }
}
