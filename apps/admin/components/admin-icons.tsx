import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function BaseIcon({ children, size = 18, ...props }: IconProps & { children: ReactNode }) {
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

export function BarChartIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 18V10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M12 18V6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M18 18V13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function MegaphoneIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12L17.5 7V17L5 12Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M8 13.5L9.5 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function MessageCircleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M12 4.75C7.99594 4.75 4.75 7.69109 4.75 11.3182C4.75 13.1882 5.60531 14.8752 6.98617 16.0511L6.25 19.25L9.06817 17.6788C9.97174 17.981 10.955 18.1364 12 18.1364C16.0041 18.1364 19.25 15.1953 19.25 11.5682C19.25 7.94109 16.0041 4.75 12 4.75Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M8.5 11.75H15.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M8.5 9.25H13.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 6H7.75C6.64543 6 5.75 6.89543 5.75 8V16C5.75 17.1046 6.64543 18 7.75 18H10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M13 9L16 12L13 15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M10.5 12H16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 12.2L10.9 14.7L15.8 9.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M3.75 12C5.6 8.8 8.43 7.2 12 7.2C15.57 7.2 18.4 8.8 20.25 12C18.4 15.2 15.57 16.8 12 16.8C8.43 16.8 5.6 15.2 3.75 12Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="2.65" stroke="currentColor" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M4.5 4.5L19.5 19.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M10.36 7.32C10.89 7.24 11.44 7.2 12 7.2C15.57 7.2 18.4 8.8 20.25 12C19.54 13.23 18.69 14.24 17.69 15.04M13.4 13.41C13.03 13.77 12.52 14 12 14C10.9 14 10 13.1 10 12C10 11.48 10.22 10.97 10.59 10.6M8.27 8.26C6.52 9.03 5 10.27 3.75 12C5.6 15.2 8.43 16.8 12 16.8C12.89 16.8 13.73 16.7 14.53 16.49"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </BaseIcon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M15.5 5.75L9.25 12L15.5 18.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9.75 12H19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 6.5L14.5 12L9 17.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}
