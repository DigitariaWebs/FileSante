import type { ComponentType, SVGProps } from "react";

import {
  IconAlertTriangle,
  IconArchive,
  IconArrowRight,
  IconArrowsUpDown,
  IconBell,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconClockOff,
  IconFirstAidKit,
  IconGauge,
  IconLayoutGrid,
  IconList,
  IconLogout,
  IconMessage2,
  IconNurse,
  IconPhoneOff,
  IconQrcode,
  IconRefresh,
  IconScan,
  IconSearch,
  IconSettings,
  IconStethoscope,
  IconTrendingUp,
  IconUserMinus,
  IconX,
} from "@tabler/icons-react";

type TablerComponent = ComponentType<SVGProps<SVGSVGElement>>;

const REGISTRY = {
  alarm: IconClock,
  archive: IconArchive,
  arrowRight: IconArrowRight,
  arrowSeparate: IconArrowsUpDown,
  bell: IconBell,
  chat: IconMessage2,
  check: IconCircleCheck,
  checkCircle: IconCircleCheck,
  clock: IconClock,
  gauge: IconGauge,
  graphUp: IconTrendingUp,
  help: IconFirstAidKit,
  lifebelt: IconStethoscope,
  logout: IconLogout,
  phoneOff: IconPhoneOff,
  qr: IconQrcode,
  refresh: IconRefresh,
  scan: IconScan,
  search: IconSearch,
  settings: IconSettings,
  taskList: IconList,
  timerOff: IconClockOff,
  userPlus: IconNurse,
  userMinus: IconUserMinus,
  viewGrid: IconLayoutGrid,
  warning: IconAlertTriangle,
  x: IconX,
  xCircle: IconCircleX,
} satisfies Record<string, TablerComponent>;

export type IconName = keyof typeof REGISTRY;

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
};

export function Icon({
  name,
  size = 17,
  strokeWidth = 1.5,
  width,
  height,
  ...rest
}: IconProps) {
  const Component = REGISTRY[name];
  return (
    <Component
      width={width ?? size}
      height={height ?? size}
      strokeWidth={strokeWidth}
      {...rest}
    />
  );
}
