import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-9 w-full" />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
        <Skeleton className="mt-4 h-9 w-40" />
      </Card>
    </div>
  );
}
