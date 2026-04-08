"use client"

type BrandMarkProps = {
  iconClassName?: string
  textClassName?: string
}

export default function BrandMark({
  iconClassName = "h-7 w-7 rounded-xl",
  textClassName = "text-[17px] font-bold tracking-tight text-[#191F28]",
}: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2">
      <img alt="근요일" className={iconClassName} draggable={false} src="/geunyoil_mark.svg" />
      <span className={textClassName}>근요일</span>
    </div>
  )
}
