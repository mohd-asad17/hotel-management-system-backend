import express from "express";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import { prisma } from "../../database/db.config";
import { JWT_SECRET } from "../config";
import { loginSchema, signupSchema } from "../ValidationSchema/auth.schema";



const router = express.Router();



router.post("/signup", async (req ,res) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }

  const { name, email, password, role, phone } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      error: null,
    });
  } catch (error) {
    console.error("Signup failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      error: "SIGNUP_FAILED",
    });
  }
});



router.post('/login', async (req, res) => {
    const parseData = loginSchema.safeParse(req.body);

    if(!parseData.success){
        return res.status(400).json({
            success: false,
            data: null,
            error: "INVALID_REQUEST",
          });
    }

    const { email, password } = parseData.data;
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    })

    if(!user) {
        return res.status(400).json({
            success: false,
            data: null,
            error: "INVALID_CREDENTIALS"
        });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if(!passwordMatch){
        return res.status(400).json({
            success: false,
            data: null, 
            error: "INVALID_CREDENTIALS"
        });
    }

    const token = jwt.sign({
        id: user.id,
        email: user.email,
        password: user.password,
        role: user.role
    }, JWT_SECRET);

    return res.status(200).json({
        success: true,
        data: {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        },
        error: null
    })
})

export default router;
