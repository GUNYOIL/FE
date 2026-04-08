"use client"

import Link from "next/link"

export default function GuestAuthSheet({
  description,
  onClose,
  open,
}: {
  description: string
  onClose: () => void
  open: boolean
}) {
  if (!open) {
    return null
  }

  return (
    <div className="absolute inset-0 z-40 flex items-end bg-[rgba(15,23,42,0.32)]">
      <button aria-label="닫기" className="absolute inset-0" onClick={onClose} type="button" />
      <div className="relative w-full rounded-t-[28px] border border-[#E5E8EB] bg-[#FFFFFF] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-24px_48px_rgba(15,23,42,0.14)]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#E5E8EB]" />
        <p className="text-[12px] font-semibold text-[#3182F6]">로그인 후 계속</p>
        <h3 className="mt-1 text-[22px] font-bold tracking-tight text-[#191F28]">내 기록으로 이어서 사용하세요</h3>
        <p className="mt-2 text-[13px] leading-6 text-[#6B7684]">{description}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            className="flex items-center justify-center rounded-[18px] border border-[#D9E0E7] bg-[#FFFFFF] px-4 py-3 text-[14px] font-semibold text-[#4E5968]"
            href="/login"
          >
            로그인
          </Link>
          <Link className="flex items-center justify-center rounded-[18px] bg-[#191F28] px-4 py-3 text-[14px] font-semibold text-white" href="/signup">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}
