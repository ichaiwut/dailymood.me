import { VerifyClient } from "@/components/verify-client";


export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
      <VerifyClient token={token ?? ""} />
    </main>
  );
}
