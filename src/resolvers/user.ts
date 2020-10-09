import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import Argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";

import { validateRegister } from "../util/resolverValidations";
import { User } from "../entities";
import { MyContext } from "../types";
import { COOKIE_NAME } from "../constants";
import { isEmail, sendEmail } from "../util";

import { Credentials } from "./Credentials";
import { FieldError } from "./FieldError";

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
    @Arg("data") { username, email, password }: Credentials
  ): Promise<UserResponse> {
    const errors = validateRegister({ username, email, password });
    if (errors) {
      return { errors };
    }

    const hashedPassword = await Argon2.hash(password);
    try {
      await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username,
          email,
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
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      isEmail(usernameOrEmail)
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          {
            fields: ["usernameOrEmail", "password"],
            message: "wrong credentials",
          },
        ],
      };
    }

    const valid = await Argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            fields: ["usernameOrEmail", "password"],
            message: "wrong credentials",
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

  @Mutation(() => Boolean)
  async forgotPassword(
    @Ctx() { em }: MyContext
  ): // @Arg("email") email: string
  Promise<boolean> {
    const user = await em.findOne(User, {});
    if (!user) {
      return false;
    }

    // const token = 'kdmldbnmSDG:Lsdlgn:"sdfg;lsg';

    // async sendEmail(email, `<a> href="http://localhost:7777/change-password/${token}">reset oassword</a>`, "asd")
    return true;
  }
}

export default UserResolver;
