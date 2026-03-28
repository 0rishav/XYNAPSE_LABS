import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

export const createActivationToken = (user) => {
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET,
    { expiresIn: "5m" },
  );

  console.log("activation code",process.env.ACTIVATION_SECRET)

  return { token, activationCode };
};