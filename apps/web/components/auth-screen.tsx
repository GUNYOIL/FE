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
  isSubmitting,
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
  isSubmitting: boolean
  onConfirmPasswordChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
  onToggleMode: () => void
  password: string
  passwordError: string
  confirmPasswordError: string
}) {
  const fields = [
    {
      key: "email",
      label: "이메일",
      value: email,
      error: emailError,
      type: "email",
      autoComplete: "email",
      placeholder: "example@email.com",
      onChange: onEmailChange,
    },
    {
      key: "password",
      label: "비밀번호",
      value: password,
      error: passwordError,
      type: "password",
      autoComplete: authMode === "signup" ? "new-password" : "current-password",
      placeholder: authMode === "signup" ? "6자 이상, 특수문자 포함" : "비밀번호",
      onChange: onPasswordChange,
    },
    ...(authMode === "signup"
      ? [
          {
            key: "confirm-password",
            label: "비밀번호 확인",
            value: confirmPassword,
            error: confirmPasswordError,
            type: "password",
            autoComplete: "new-password",
            placeholder: "비밀번호 다시 입력",
            onChange: onConfirmPasswordChange,
          },
        ]
      : []),
  ]

  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-[#FFFFFF]">
      <header className="sticky top-0 z-20 border-b border-[#EEF1F4] bg-[rgba(255,255,255,0.92)] px-5 pt-safe-top backdrop-blur">
        <div className="flex h-14 items-center justify-between">
          <BrandMark iconClassName="h-7 w-7 rounded-[10px]" textClassName="text-[18px] font-bold text-[#191F28]" />
          {authMode === "signup" ? (
            <span className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-[11px] font-semibold text-[#6B7684]">1/3</span>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-36 pt-8">
        <div>
          <p className="text-[12px] font-semibold text-[#8B95A1]">{authMode === "signup" ? "계정 만들기" : "계정 로그인"}</p>
          <h1 className="mt-2 text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-[#191F28]">
            {authMode === "signup" ? "회원가입" : "로그인"}
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#6B7684]">
            {authMode === "signup" ? "계정을 만들고 바로 기본 정보와 루틴을 설정합니다" : "기존 계정으로 이어서 들어갑니다"}
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[26px] border border-[#E7EBEF] bg-[#F7F8FA]">
          {fields.map((field, index) => (
            <div
              key={field.key}
              className={`px-4 py-4 ${index === 0 ? "" : "border-t border-[#E7EBEF]"}`}
            >
              <label className="block text-[12px] font-semibold text-[#6B7684]">{field.label}</label>
              <input
                aria-invalid={Boolean(field.error)}
                autoComplete={field.autoComplete}
                className="mt-2 h-8 w-full bg-transparent text-[17px] font-semibold text-[#191F28] outline-none placeholder:font-medium placeholder:text-[#A2ABB6]"
                onChange={(event) => field.onChange(event.target.value)}
                placeholder={field.placeholder}
                type={field.type}
                value={field.value}
              />
              {field.error ? <p className="mt-2 text-[12px] font-medium text-[#F97316]">{field.error}</p> : null}
            </div>
          ))}
        </div>

        {authError ? (
          <div className="mt-4 rounded-[18px] bg-[#FFF4EB] px-4 py-3 text-[13px] font-medium text-[#F97316]">{authError}</div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-white via-white to-[rgba(255,255,255,0)]">
        <div className="mx-auto max-w-[480px] px-5 pb-safe-bottom pt-6">
          <p className="mb-3 text-center text-[13px] text-[#8B95A1]">
            {authMode === "signup" ? "계정이 있다면? " : "계정이 없다면? "}
            <button className="font-semibold text-[#3182F6]" onClick={onToggleMode} type="button">
              {authMode === "signup" ? "로그인" : "회원가입"}
            </button>
          </p>
          <button
            className={`h-14 w-full rounded-[18px] text-[15px] font-semibold transition-all ${
              canSubmit && !isSubmitting ? "bg-[#191F28] text-white active:scale-[0.99]" : "bg-[#E7EBEF] text-[#9AA4B2]"
            }`}
            disabled={!canSubmit || isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? "처리 중..." : authMode === "signup" ? "다음" : "로그인"}
          </button>
        </div>
      </div>
    </div>
  )
}
