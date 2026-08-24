import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-32" />
      </div>

      <Card>
        <Skeleton className="h-64 w-full" />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-3 h-60 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
