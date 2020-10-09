import { Credentials } from "../resolvers/Credentials";
import isEmail from "./isEmail";

// eslint-disable-next-line import/prefer-default-export
export const validateRegister = ({
  email,
  username,
  password,
}: Credentials): { fields: string[]; message: string }[] | null => {
  const errors = [];
  if (username.length <= 3) {
    errors.push({
      fields: ["username"],
      message: "length at least 4",
    });
  }

  if (!isEmail(email)) {
    errors.push({
      fields: ["email"],
      message: "not valid email address ",
    });
  }

  if (password.length <= 5) {
    errors.push({
      fields: ["password"],
      message: "length at least 6 ",
    });
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
  if (errors.length) {
    return errors;
  }
  return null;
};
