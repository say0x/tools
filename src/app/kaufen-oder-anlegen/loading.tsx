import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-6 w-24" />
        </Card>
        <Card>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-6 w-24" />
        </Card>
      </div>

      <Card>
        <Skeleton className="h-4 w-full max-w-sm" />
      </Card>

      <Card>
        <Skeleton className="h-72 w-full" />
      </Card>
    </div>
  );
}
