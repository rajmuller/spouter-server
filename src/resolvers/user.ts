import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";
import Argon2 from "argon2";

import { Post, User } from "../entities";
import { MyContext } from "../types";

@Resolver()
class UserResolver {
  @Query(() => [User])
  users(@Ctx() { em }: MyContext): Promise<User[]> {
    return em.find(User, {});
  }

  @Mutation(() => User)
  async register(
    @Ctx() { em }: MyContext,
    @Arg("username") username: string,
    @Arg("password") password: string
  ): Promise<User> {
    const hashedPassword = await Argon2.hash(password);
    const user = em.create(User, { username, password: hashedPassword });
    await em.persistAndFlush(user);
    return user;
  }

  @Query(() => Post, { nullable: true })
  post(
    @Ctx() { em }: MyContext,
    @Arg("id", () => Int) id: number
  ): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  @Mutation(() => Post)
  async createPost(
    @Ctx() { em }: MyContext,
    @Arg("title") title: string
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  // @Mutation(() => Post, { nullable: true })
  // async updatePost(
  //   @Ctx() { em }: MyContext,
  //   @Arg("id") id: number,
  //   @Arg("title", () => String, { nullable: true }) title: string
  // ): Promise<Post | null> {
  //   const post = await em.findOne(Post, { id });
  //   if (!post) {
  //     return null;
  //   }
  //   if (typeof title !== "undefined") {
  //     post.title = title;
  //     await em.persistAndFlush(post);
  //   }
  //   return post;
  // }
  //
  // @Mutation(() => Boolean, { nullable: true })
  // async deletePost(
  //   @Ctx() { em }: MyContext,
  //   @Arg("id") id: number
  // ): Promise<boolean> {
  //   const asd = await em.nativeDelete(Post, { id });
  //   return !!asd;
  // }
}

export default UserResolver;
