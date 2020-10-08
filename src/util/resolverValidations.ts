import { Credentials } from "../resolvers/Credentials";
import isEmail from "./isEmail";

// eslint-disable-next-line import/prefer-default-export
export const validateRegister = ({
  email,
  username,
  password,
}: Credentials): { fields: string[]; message: string }[] | null => {
  if (username.length <= 3) {
    return [
      {
        fields: ["username"],
        message: "length at least 4",
      },
    ];
  }

  if (isEmail(email)) {
    return [
      {
        fields: ["email"],
        message: "not valid email address ",
      },
    ];
  }

  if (password.length <= 5) {
    return [
      {
        fields: ["password"],
        message: "length at least 6 ",
      },
    ];
  }

  // if (!password.match(/[A-Z]/g)) {
  //   return {
  //     [
  //       {
  //         fields: ["password"],
  //         message: "at least one uppercase letter",
  //       },
  //     ]
  // }

  return null;
};
