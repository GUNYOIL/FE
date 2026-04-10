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

export function MessageCircleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M12 4.5C7.85786 4.5 4.5 7.41015 4.5 11C4.5 12.8664 5.40844 14.5489 6.87189 15.7337L6.25 19.5L9.33649 17.8512C10.1842 18.1081 11.0786 18.25 12 18.25C16.1421 18.25 19.5 15.3399 19.5 11.75C19.5 8.16015 16.1421 4.5 12 4.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M8.75 11.25H15.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M8.75 8.75H12.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function MegaphoneIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M13.25 7.25L17.75 5.5V18.5L13.25 16.75V7.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M13.25 7.5H9.5C7.98122 7.5 6.75 8.73122 6.75 10.25V13.75C6.75 15.2688 7.98122 16.5 9.5 16.5H13.25"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M8.5 16.5L9.5 19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M18.75 9C19.6642 9.76837 20.25 10.919 20.25 12.25C20.25 13.581 19.6642 14.7316 18.75 15.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M12 5.25C9.65279 5.25 7.75 7.15279 7.75 9.5V11.625C7.75 12.2436 7.529 12.8418 7.12624 13.3113L6 14.625H18L16.8738 13.3113C16.471 12.8418 16.25 12.2436 16.25 11.625V9.5C16.25 7.15279 14.3472 5.25 12 5.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M10 17.25C10.35 18.1 11.1 18.75 12 18.75C12.9 18.75 13.65 18.1 14 17.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}
