import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-7 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <Card>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-9 w-full" />
      </Card>

      <Card>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </Card>

      <Card>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-64 w-full" />
      </Card>
    </div>
  );
}
