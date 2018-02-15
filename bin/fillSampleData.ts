#!/usr/bin/env node

console.log(`Sandra/backend-api (C) 2017 Sandra Project Team\n
This program comes with ABSOLUTELY NO WARRANTY.
This is free software, and you are welcome to redistribute it
under certain conditions.
For more information, see "${__dirname}/../LICENSE.md".
`);

import dbInit from "../lib/db";
import { User, Session } from "../models";
import { getManager } from "typeorm";

(async () => {
  await dbInit;
  const admin = new User("admin@example.com");
  const user = new User("user@example.com");
  const adminSession = new Session(admin);
  const adminSessionWithoutPermission = new Session(admin);
  const userSession = new Session(user);
  await admin.setPassword("admin");
  adminSession.permission.grant("admin");
  await user.setPassword("user");
  await getManager().save([admin, user, adminSession, adminSessionWithoutPermission, userSession]);
})();
