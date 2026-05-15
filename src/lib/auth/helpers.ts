import { headers } from "next/headers";
import { auth } from "./server";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireRole(
  allowedRoles: string[],
  request?: Request,
): Promise<NonNullable<Awaited<ReturnType<typeof getSession>>>> {
  const session = request
    ? await auth.api.getSession({ headers: request.headers })
    : await getSession();

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const user = session.user as { role?: string } & typeof session.user;

  if (!allowedRoles.includes(user.role ?? "")) {
    throw new Response("Forbidden", { status: 403 });
  }

  return session as NonNullable<typeof session>;
}
