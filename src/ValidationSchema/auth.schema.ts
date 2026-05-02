import z from "zod";

export const signupSchema = z.object({
    name: z.string().min(1),
    email: z.string(),
    password: z.string().min(6),
    role: z.enum(["CUSTOMER", "OWNER"]),
    phone: z.string().optional(),
  });

  export const loginSchema = z.object({
    email: z.string(),
    password: z.string()
})