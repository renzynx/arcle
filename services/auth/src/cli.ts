#!/usr/bin/env bun
import { eq } from "drizzle-orm";
import { db, user } from "./db";
import { auth } from "./lib/auth";

const commands = {
  "admin:create": createAdmin,
  "admin:list": listAdmins,
  help: showHelp,
};

type Command = keyof typeof commands;

function showHelp() {
  console.log(`
Arcle Auth CLI

Usage: bun cli <command> [options]

Commands:
  admin:create    Create an admin user
  admin:list      List all admin users
  help            Show this help message

Examples:
  bun cli admin:create --email admin@example.com --password secret123
  bun cli admin:create -e admin@example.com -p secret123 -n "Super Admin"
  bun cli admin:list
`);
}

async function createAdmin() {
  const args = process.argv.slice(3);
  let email: string | undefined;
  let password: string | undefined;
  let name = "Admin";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === "--email" || arg === "-e") {
      email = next;
      i++;
    } else if (arg === "--password" || arg === "-p") {
      password = next;
      i++;
    } else if (arg === "--name" || arg === "-n") {
      name = next ?? "Admin";
      i++;
    }
  }

  if (!email || !password) {
    console.error(
      "Usage: bun cli admin:create --email <email> --password <password> [--name <name>]",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Error: Password must be at least 8 characters");
    process.exit(1);
  }

  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existing) {
    if (existing.role === "admin") {
      console.log(`Admin already exists: ${email}`);
      return;
    }
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, existing.id));
    console.log(`Upgraded to admin: ${email}`);
    return;
  }

  await auth.api.createUser({
    body: { email, password, name, role: "admin" },
  });

  console.log(`✓ Admin created: ${email}`);
}

async function listAdmins() {
  const admins = await db.query.user.findMany({
    where: eq(user.role, "admin"),
    columns: { id: true, email: true, name: true, createdAt: true },
  });

  if (admins.length === 0) {
    console.log("No admin users found");
    return;
  }

  console.log("\nAdmin users:");
  console.log("─".repeat(60));
  for (const admin of admins) {
    console.log(
      `  ${admin.email} (${admin.name}) - created ${admin.createdAt.toISOString()}`,
    );
  }
  console.log();
}

async function main() {
  const command = (process.argv[2] || "help") as Command;
  const handler = commands[command];

  if (!handler) {
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }

  await handler();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
