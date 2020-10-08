import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class FieldError {
  @Field(() => [String])
  fields: string[];

  @Field()
  message: string;
}
