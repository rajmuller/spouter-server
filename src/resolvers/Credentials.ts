import { Field, InputType } from "type-graphql";

@InputType()
// eslint-disable-next-line import/prefer-default-export
export class Credentials {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  password: string;
}
