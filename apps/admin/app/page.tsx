export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-canvas px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[28px] border border-line bg-panel px-6 py-7 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">Gunyoil Admin</p>
          <h1 className="mt-3 text-[32px] font-bold tracking-[-0.04em] text-ink">운영 화면 워크스페이스</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-mute">
            관리자 전용 앱이 모노레포 안의 <code>apps/admin</code> 에서 배포되도록 구조를 먼저 정리한 상태입니다.
          </p>
        </div>
      </div>
    </main>
  );
}
