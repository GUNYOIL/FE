import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function BaseIcon({ children, size = 16, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16L20 20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function XIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 6L18 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12.5L9.5 17L19 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function Trash2Icon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M9 4H15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M7 7L8 19H16L17 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M10 10V16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M14 10V16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function GripVerticalIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="9" cy="6.5" fill="currentColor" r="1.2" />
      <circle cx="9" cy="12" fill="currentColor" r="1.2" />
      <circle cx="9" cy="17.5" fill="currentColor" r="1.2" />
      <circle cx="15" cy="6.5" fill="currentColor" r="1.2" />
      <circle cx="15" cy="12" fill="currentColor" r="1.2" />
      <circle cx="15" cy="17.5" fill="currentColor" r="1.2" />
    </BaseIcon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5V19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M5 12H19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12H19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function CircleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function CheckCircle2Icon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 12.3L11 14.8L15.8 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}
