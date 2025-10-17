import { SessionProvider } from "next-auth/react";

export default function LocaleSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
