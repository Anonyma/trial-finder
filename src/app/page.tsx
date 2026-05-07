import Link from "next/link";

// Absolute minimal test
export const dynamic = "force-static";

export default function HomePage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl mb-4">Trial Finder</h1>
      <p className="mb-4">Find a cancer clinical trial.</p>
      <Link href="/about" className="text-blue-600">About</Link>
    </div>
  );
}
