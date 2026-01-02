import { eq } from "drizzle-orm";
import { db, user } from "../db";
import { auth } from "../lib/auth";

interface AdminOptions {
  email: string;
  password: string;
  name: string;
}

function parseArgs(): AdminOptions {
  const args = process.argv.slice(2);
  const options: Partial<AdminOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === "--email" || arg === "-e") {
      options.email = nextArg;
      i++;
    } else if (arg === "--password" || arg === "-p") {
      options.password = nextArg;
      i++;
    } else if (arg === "--name" || arg === "-n") {
      options.name = nextArg;
      i++;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: bun run admin:create [options]

Options:
  -e, --email <email>       Admin email (required)
  -p, --password <password> Admin password (required)
  -n, --name <name>         Admin name (default: "Admin")
  -h, --help                Show this help message

Example:
  bun run admin:create --email admin@example.com --password secret123
`);
      process.exit(0);
    }
  }

  if (!options.email) {
    console.error("Error: --email is required");
    process.exit(1);
  }

  if (!options.password) {
    console.error("Error: --password is required");
    process.exit(1);
  }

  if (options.password.length < 8) {
    console.error("Error: Password must be at least 8 characters");
    process.exit(1);
  }

  return {
    email: options.email,
    password: options.password,
    name: options.name ?? "Admin",
  };
}

async function createAdmin(options: AdminOptions) {
  const { email, password, name } = options;

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existingUser) {
    if (existingUser.role === "admin") {
      console.log(`Admin user already exists: ${email}`);
      process.exit(0);
    }

    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, existingUser.id));
    console.log(`Upgraded existing user to admin: ${email}`);
    process.exit(0);
  }

  const newUser = await auth.api.createUser({
    body: {
      email,
      password,
      name,
      role: "admin",
    },
  });

  if (!newUser) {
    throw new Error("Failed to create user");
  }

  console.log(`✓ Admin user created successfully`);
  console.log(`  Email: ${email}`);
  console.log(`  Name: ${name}`);
}

const options = parseArgs();
createAdmin(options)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to create admin:", err);
    process.exit(1);
  });
