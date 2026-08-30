import { ladeNutzer } from "@/server/actions/user";
import { getActiveUserId } from "@/server/session";
import { UserSwitcherMenu } from "./UserSwitcherMenu";

// Server Component: Nav.tsx ist "use client" und kann cookies()/Prisma nicht
// direkt aufrufen — dieser Wrapper lädt die Daten server-seitig und reicht sie
// an die Client-Component für das eigentliche Dropdown weiter.
export async function UserSwitcher() {
  const [nutzer, aktiverUserId] = await Promise.all([ladeNutzer(), getActiveUserId()]);
  return <UserSwitcherMenu users={nutzer} activeUserId={aktiverUserId} />;
}
