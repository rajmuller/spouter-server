import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import Argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";

import { User } from "../entities";
import { MyContext } from "../types";
import { COOKIE_NAME } from "../constants";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field(() => [String])
  fields: string[];

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
class UserResolver {
  @Query(() => [User])
  users(@Ctx() { em }: MyContext): Promise<User[]> {
    return em.find(User, {});
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext): Promise<User | null> {
    const { userId } = req.session;

    if (!userId) {
      return null;
    }

    return em.findOne(User, { id: userId });
  }

  @Mutation(() => UserResponse)
  async register(
    @Ctx() { em }: MyContext,
    @Arg("data") { username, password }: UsernamePasswordInput
  ): Promise<UserResponse> {
    if (username.length <= 3) {
      return {
        errors: [
          {
            fields: ["username"],
            message: "length at least 4",
          },
        ],
      };
    }

    if (password.length <= 5) {
      return {
        errors: [
          {
            fields: ["password"],
            message: "length at least 6 ",
          },
        ],
      };
    }

    // if (!password.match(/[A-Z]/g)) {
    //   return {
    //     errors: [
    //       {
    //         fields: ["password"],
    //         message: "at least one uppercase letter",
    //       },
    //     ],
    //   };
    // }

    const hashedPassword = await Argon2.hash(password);
    try {
      await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");
    } catch (err) {
      console.log("err: ", err);
      if (err.code === "23505") {
        return {
          errors: [
            {
              fields: ["username"],
              message: "already taken",
            },
          ],
        };
      }
    }
    const user = (await em.findOne(User, { username })) as User;
    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Ctx() { em, req }: MyContext,
    @Arg("data") { username, password }: UsernamePasswordInput
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username });
    if (!user) {
      return {
        errors: [
          {
            fields: ["username", "password"],
            message: "wrong username or password",
          },
        ],
      };
    }

    const valid = await Argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            fields: ["username", "password"],
            message: "wrong username or password",
          },
        ],
      };
    }
    req.session.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        if (err) {
          console.log("err: ", err);
          return resolve(false);
        }
        res.clearCookie(COOKIE_NAME);
        return resolve(true);
      })
    );
  }
}

export default UserResolver;
