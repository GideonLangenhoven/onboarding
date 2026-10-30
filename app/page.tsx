import Gate, { Landing } from "./components/Gate";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) return <Landing />;

  return <Gate token={token} />;
}
