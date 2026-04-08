"use client";

export default function AdminBrandMark() {
  return (
    <div className="flex items-center gap-3">
      <img alt="근요일" className="h-10 w-10 rounded-[14px]" draggable={false} src="/geunyoil_mark.svg" />
      <div>
        <p className="text-[17px] font-bold tracking-tight text-[#191F28]">근요일 Admin</p>
        <p className="text-[12px] font-medium text-[#8B95A1]">Operations Dashboard</p>
      </div>
    </div>
  );
}
