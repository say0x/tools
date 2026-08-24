import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />
      </div>

      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-5 w-64" />
          <Skeleton className="mt-4 h-40 w-full" />
        </Card>
      ))}
    </div>
  );
}
