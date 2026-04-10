// prisma.config.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:dev.sqlite',  // Your actual connection URL here
    },
  },
})

export { prisma }