import { ForbiddenPage } from "@/components/forbidden-page";

export const runtime = "edge";

export default function Forbidden() {
  return <ForbiddenPage />;
}
