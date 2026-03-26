"use client"

import BrandMark from "@/components/brand-mark"

type AuthMode = "signup" | "login"

export default function AuthScreen({
  authError,
  authMode,
  canSubmit,
  confirmPassword,
  email,
  emailError,
  onConfirmPasswordChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleMode,
  password,
  passwordError,
  confirmPasswordError,
}: {
  authError: string
  authMode: AuthMode
  canSubmit: boolean
  confirmPassword: string
  email: string
  emailError: string
  onConfirmPasswordChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
  onToggleMode: () => void
  password: string
  passwordError: string
  confirmPasswordError: string
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-[#F2F4F6]">
      <header className="sticky top-0 z-20 border-b border-[#E5E8EB] bg-[#FFFFFF] px-4 pt-safe-top">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandMark iconClassName="h-6 w-6 rounded-lg" textClassName="text-[17px] font-bold text-[#191F28]" />
            {authMode === "signup" ? (
              <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-medium text-[#8B95A1]">
                1/3
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[360px]">
          <div className="px-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E8EB] bg-[#FFFFFF] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#3182F6]" />
              <span className="text-[11px] font-semibold text-[#6B7684]">
                {authMode === "signup" ? "새 계정 등록" : "저장된 계정으로 진입"}
              </span>
            </div>
            <h1 className="mt-4 text-[30px] font-bold leading-[1.14] text-[#191F28]">
              {authMode === "signup" ? "회원가입" : "로그인"}
            </h1>
            <p className="mt-2 text-[13px] leading-5 text-[#8B95A1]">
              {authMode === "signup" ? "계정을 만들고 바로 기본 정보와 루틴을 설정합니다" : "가입한 계정으로 이어서 들어갑니다"}
            </p>
          </div>

          <div className="mt-5 rounded-[26px] border border-[#E5E8EB] bg-[#FFFFFF] p-5 shadow-[0_18px_28px_-24px_rgba(15,23,42,0.22)]">
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[#4E5968]">이메일</label>
                <input
                  aria-invalid={Boolean(emailError)}
                  autoComplete="email"
                  className="w-full rounded-[18px] border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3.5 text-[15px] font-medium text-[#191F28] outline-none placeholder:text-[#8B95A1]"
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="이메일"
                  type="email"
                  value={email}
                />
                {emailError ? <p className="mt-2 text-[12px] font-medium text-[#F97316]">{emailError}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[#4E5968]">비밀번호</label>
                <input
                  aria-invalid={Boolean(passwordError)}
                  autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                  className="w-full rounded-[18px] border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3.5 text-[15px] font-medium text-[#191F28] outline-none placeholder:text-[#8B95A1]"
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="비밀번호"
                  type="password"
                  value={password}
                />
                {passwordError ? <p className="mt-2 text-[12px] font-medium text-[#F97316]">{passwordError}</p> : null}
              </div>

              {authMode === "signup" ? (
                <div>
                  <label className="mb-2 block text-[12px] font-semibold text-[#4E5968]">비밀번호 확인</label>
                  <input
                    aria-invalid={Boolean(confirmPasswordError)}
                    autoComplete="new-password"
                    className="w-full rounded-[18px] border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3.5 text-[15px] font-medium text-[#191F28] outline-none placeholder:text-[#8B95A1]"
                    onChange={(event) => onConfirmPasswordChange(event.target.value)}
                    placeholder="비밀번호 확인"
                    type="password"
                    value={confirmPassword}
                  />
                  {confirmPasswordError ? (
                    <p className="mt-2 text-[12px] font-medium text-[#F97316]">{confirmPasswordError}</p>
                  ) : null}
                </div>
              ) : null}

              {authError ? <p className="text-[12px] font-medium text-[#F97316]">{authError}</p> : null}
            </div>

            <div className="mt-5 border-t border-[#F2F4F6] pt-4">
              <button
                className={`w-full rounded-[18px] py-3.5 text-[14px] font-semibold transition-opacity ${
                  canSubmit ? "bg-[#3182F6] text-white active:opacity-75" : "bg-[#E5E8EB] text-[#8B95A1]"
                }`}
                disabled={!canSubmit}
                onClick={onSubmit}
                type="button"
              >
                {authMode === "signup" ? "다음" : "로그인"}
              </button>
              <p className="mt-4 text-center text-[12px] text-[#8B95A1]">
                {authMode === "signup" ? "계정이 있다면? " : "계정이 없다면? "}
                <button className="font-semibold text-[#3182F6]" onClick={onToggleMode} type="button">
                  {authMode === "signup" ? "로그인" : "회원가입"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
