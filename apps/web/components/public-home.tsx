import Link from "next/link"
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-config"

const FEATURE_ITEMS = [
  {
    title: "루틴 설계",
    description: "요일별 운동 루틴을 정리하고 교내 헬스장 환경에 맞게 바로 조정합니다.",
  },
  {
    title: "오늘 기록",
    description: "오늘 운동 세트와 완료 상태를 한 화면에서 기록하고 저장합니다.",
  },
  {
    title: "단백질 관리",
    description: "급식 선택, 빠른 추가, 직접 입력으로 섭취량을 누적 관리합니다.",
  },
  {
    title: "운동 잔디",
    description: "날짜별 진행률과 완료 여부를 잔디 화면으로 한눈에 확인합니다.",
  },
]

export default function PublicHome() {
  return (
    <main className="min-h-svh bg-[#F7F8FA] text-[#191F28]">
      <section className="mx-auto flex min-h-svh max-w-[980px] flex-col px-5 pt-6 pb-12 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img alt={SITE_NAME} className="h-10 w-10 rounded-[14px]" draggable={false} src="/geunyoil_mark.svg" />
            <div>
              <p className="text-[18px] font-bold tracking-tight">{SITE_NAME}</p>
              <p className="text-[12px] text-[#6B7684]">교내 운동 루틴·기록·단백질 관리</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              className="rounded-full border border-[#D9E0E7] bg-white px-4 py-2 text-[13px] font-semibold text-[#4E5968]"
              href="/login"
            >
              로그인
            </Link>
            <Link className="rounded-full bg-[#191F28] px-4 py-2 text-[13px] font-semibold text-white" href="/signup">
              시작하기
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
          <div>
            <p className="inline-flex rounded-full border border-[#D6E4FF] bg-[#EFF6FF] px-3 py-1 text-[12px] font-semibold text-[#2563EB]">
              운동 루틴부터 급식 단백질까지
            </p>
            <h1 className="mt-5 text-[38px] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[56px]">
              {SITE_NAME}
              <br />
              운동 기록을
              <br />
              매일 이어가게 만드는 앱
            </h1>
            <p className="mt-5 max-w-[620px] text-[15px] leading-7 text-[#4E5968] sm:text-[17px]">
              {SITE_DESCRIPTION}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-[18px] bg-[#191F28] px-5 py-3 text-[15px] font-semibold text-white" href="/signup">
                회원가입 후 시작
              </Link>
              <Link
                className="rounded-[18px] border border-[#D9E0E7] bg-white px-5 py-3 text-[15px] font-semibold text-[#4E5968]"
                href="/login"
              >
                기존 계정 로그인
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {FEATURE_ITEMS.map((item, index) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-[#E5E8EB] bg-white px-5 py-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#191F28] text-[12px] font-semibold text-white">
                  0{index + 1}
                </div>
                <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{item.title}</h2>
                <p className="mt-2 text-[14px] leading-6 text-[#6B7684]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <section className="grid gap-3 border-t border-[#E5E8EB] pt-6 text-[13px] leading-6 text-[#6B7684] sm:grid-cols-3">
          <div className="rounded-[20px] bg-white px-4 py-4">
            <p className="font-semibold text-[#191F28]">브랜드 검색 대응</p>
            <p className="mt-1">근요일 브랜드명, 서비스 설명, 구조화 데이터를 루트 페이지에서 검색엔진이 읽을 수 있게 제공합니다.</p>
          </div>
          <div className="rounded-[20px] bg-white px-4 py-4">
            <p className="font-semibold text-[#191F28]">모바일 앱형 경험</p>
            <p className="mt-1">PWA 기반으로 홈 화면 설치와 모바일 중심 사용 흐름을 지원합니다.</p>
          </div>
          <div className="rounded-[20px] bg-white px-4 py-4">
            <p className="font-semibold text-[#191F28]">운동 데이터 연동</p>
            <p className="mt-1">루틴, 오늘 운동, 급식, 단백질, 잔디 흐름을 연결해 매일의 운동 습관을 관리합니다.</p>
          </div>
        </section>
      </section>
    </main>
  )
}
