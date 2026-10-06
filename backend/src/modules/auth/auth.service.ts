//auth.service.ts → Business logic (hash passwords, create users, generate JWTs)

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { Role } from "../../generated/prisma/enums";
import { RegisterInput, LoginInput } from "./auth.validation";

export const registerUser = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      role: data.role ?? Role.USER,
      
    },
  });


  const { passwordHash, ...safeUser } = newUser;

  return {
    user: safeUser,
    token: jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        },  
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    }
  ),
  };    
};

export const loginUser = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(
    data.password,
    user.passwordHash
  );

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }


  const { passwordHash, ...safeUser } = user;

  return {
    user: safeUser,
    token: jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        },  
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    }
  ),
  };    
};

  




