"use server"

import { prisma } from "../prisma";

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        color: true,
        role: true,
      },
      orderBy: {
        username: 'asc'
      }
    });
    return users;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
}
