import { config } from "dotenv";
config({ path: ".env.local" });

import { auth } from "../src/lib/auth/server";
import { db } from "../src/lib/db";

const ADMIN_EMAIL = "admin@school.com";
const ADMIN_PASSWORD = "admin12345";
const ADMIN_NAME = "Admin";

async function main() {
  const existing = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL} (role: ${existing.role})`);
    if (existing.role !== "admin") {
      await db.user.update({
        where: { id: existing.id },
        data: { role: "admin" },
      });
      console.log("→ role updated to admin");
    }
    return;
  }

  const result = await auth.api.signUpEmail({
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
    },
  });

  await db.user.update({
    where: { id: result.user.id },
    data: { role: "admin" },
  });

  console.log(`Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
