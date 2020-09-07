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

import { User } from "../entities";
import { MyContext } from "../types";

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
  field: string[];

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
            field: ["username"],
            message: "length at least 4",
          },
        ],
      };
    }

    if (password.length <= 5) {
      return {
        errors: [
          {
            field: ["password"],
            message: "length at least 6 ",
          },
        ],
      };
    }

    if (!password.match(/[A-Z]/g)) {
      return {
        errors: [
          {
            field: ["password"],
            message: "at least one uppercase letter",
          },
        ],
      };
    }

    const hashedPassword = await Argon2.hash(password);
    const user = em.create(User, { username, password: hashedPassword });
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: ["username"],
              message: "already taken",
            },
          ],
        };
      }
      return {
        errors: [
          {
            field: ["unknown"],
            message: err.toString(),
          },
        ],
      };
    }
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
            field: ["username", "password"],
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
            field: ["username", "password"],
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
}

export default UserResolver;
