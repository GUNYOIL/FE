"use client"

function SkeletonBlock({
  className,
}: {
  className: string
}) {
  return <div className={`animate-pulse rounded-[18px] bg-[#E9EDF1] ${className}`} />
}

export function AppShellSkeleton() {
  return (
    <div
      className="flex flex-col bg-[#FFFFFF]"
      style={{
        height: "100svh",
        margin: "0 auto",
        maxWidth: 480,
      }}
    >
      <header className="shrink-0 border-b border-[#EEF1F4] bg-[rgba(255,255,255,0.94)] px-4 pt-safe-top backdrop-blur">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-7 w-7 rounded-[10px]" />
            <SkeletonBlock className="h-5 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-8 w-20 rounded-full" />
          </div>
        </div>
        <div className="pb-3">
          <SkeletonBlock className="h-4 w-40" />
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-[#F7F8FA] px-4 pt-5">
        <div className="space-y-4">
          <div>
            <SkeletonBlock className="mb-2 h-3 w-14" />
            <SkeletonBlock className="h-8 w-36" />
          </div>
          <div className="rounded-[26px] border border-[#E5E8EB] bg-[#FFFFFF] p-4">
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-10 w-24" />
                <SkeletonBlock className="h-4 w-28" />
              </div>
              <div className="space-y-2 text-right">
                <SkeletonBlock className="ml-auto h-3 w-16" />
                <SkeletonBlock className="ml-auto h-6 w-14" />
              </div>
            </div>
            <SkeletonBlock className="mt-4 h-2 w-full rounded-full" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
          </div>
          <div className="rounded-[20px] bg-[#FFFFFF] px-4 py-3 shadow-[inset_0_0_0_1px_rgba(229,232,235,1)]">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="mt-2 h-3 w-full" />
            <SkeletonBlock className="mt-1 h-3 w-4/5" />
          </div>
          <div className="space-y-3 pb-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-9 w-9 rounded-full" />
                    <div className="space-y-2">
                      <SkeletonBlock className="h-4 w-28" />
                      <SkeletonBlock className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <SkeletonBlock className="ml-auto h-4 w-10" />
                    <SkeletonBlock className="ml-auto h-3 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="shrink-0 border-t border-[#EEF1F4] bg-[rgba(255,255,255,0.96)] px-2 pb-safe-bottom pt-1 backdrop-blur">
        <div className="grid grid-cols-4 gap-2" style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))" }}>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex flex-col items-center justify-center gap-2 py-2.5">
              <SkeletonBlock className="h-1 w-8 rounded-full" />
              <SkeletonBlock className="h-5 w-5 rounded-full" />
              <SkeletonBlock className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function GrassScreenSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 pt-5 pb-6">
      <SkeletonBlock className="h-7 w-24" />
      <SkeletonBlock className="mt-2 h-4 w-28" />

      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonBlock key={index} className="h-20 w-full" />
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] p-4">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, index) => (
            <SkeletonBlock key={index} className="mx-auto h-3 w-4" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, index) => (
            <SkeletonBlock key={index} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#E5E8EB] bg-[#F8FAFC] p-4">
        <SkeletonBlock className="h-4 w-24" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonBlock className="h-3 w-10" />
              <SkeletonBlock className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProteinScreenSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 pt-5 pb-6">
      <SkeletonBlock className="h-3 w-14" />
      <SkeletonBlock className="mt-2 h-8 w-24" />
      <SkeletonBlock className="mt-2 h-4 w-44" />

      <div className="mt-4 rounded-[26px] border border-[#E5E8EB] bg-[#FFFFFF] p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-10 w-28" />
          </div>
          <SkeletonBlock className="h-8 w-20 rounded-full" />
        </div>
        <SkeletonBlock className="mt-4 h-2.5 w-full rounded-full" />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <SkeletonBlock className="h-20 w-full" />
          <SkeletonBlock className="h-20 w-full" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E5E8EB] px-4 py-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
          <SkeletonBlock className="h-8 w-20 rounded-full" />
        </div>
        <div className="space-y-3 px-4 py-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-xl bg-[#F8FAFC] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="h-3 w-16" />
                </div>
                <SkeletonBlock className="h-8 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-3 w-16" />
              </div>
              <SkeletonBlock className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
