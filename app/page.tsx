import Gate, { DeadEnd } from "./components/Gate";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <DeadEnd reason="There is no setup code in this address." />;
  }

  return <Gate token={token} />;
}
