import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
  series: ["create", "update", "delete", "publish"],
  chapter: ["create", "update", "delete", "publish"],
  media: ["upload", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
  user: [],
  session: [],
  series: [],
  chapter: [],
  media: [],
});

export const moderator = ac.newRole({
  user: ["list"],
  session: [],
  series: ["update", "publish"],
  chapter: ["update", "publish"],
  media: ["upload"],
});

export const editor = ac.newRole({
  user: [],
  session: [],
  series: ["create", "update", "publish"],
  chapter: ["create", "update", "delete", "publish"],
  media: ["upload", "delete"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  series: ["create", "update", "delete", "publish"],
  chapter: ["create", "update", "delete", "publish"],
  media: ["upload", "delete"],
});

export const roles = {
  admin,
  editor,
  moderator,
  user,
} as const;
