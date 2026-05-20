import type { ComponentType, SVGProps } from "react";

import {
  Alarm,
  Archive,
  ArrowRight,
  ArrowSeparateVertical,
  BellNotification,
  ChatBubble,
  Check,
  CheckCircle,
  Clock,
  DashboardSpeed,
  GraphUp,
  HelpCircle,
  Lifebelt,
  LogOut,
  PhoneXmark,
  QrCode,
  Refresh,
  Scanning,
  Search,
  Settings,
  TaskList,
  TimerOff,
  UserPlus,
  UserXmark,
  ViewGrid,
  WarningTriangle,
  Xmark,
  XmarkCircle,
} from "iconoir-react";

type IconoirComponent = ComponentType<SVGProps<SVGSVGElement>>;

const REGISTRY = {
  alarm: Alarm,
  archive: Archive,
  arrowRight: ArrowRight,
  arrowSeparate: ArrowSeparateVertical,
  bell: BellNotification,
  chat: ChatBubble,
  check: Check,
  checkCircle: CheckCircle,
  clock: Clock,
  gauge: DashboardSpeed,
  graphUp: GraphUp,
  help: HelpCircle,
  lifebelt: Lifebelt,
  logout: LogOut,
  phoneOff: PhoneXmark,
  qr: QrCode,
  refresh: Refresh,
  scan: Scanning,
  search: Search,
  settings: Settings,
  taskList: TaskList,
  timerOff: TimerOff,
  userPlus: UserPlus,
  userMinus: UserXmark,
  viewGrid: ViewGrid,
  warning: WarningTriangle,
  x: Xmark,
  xCircle: XmarkCircle,
} satisfies Record<string, IconoirComponent>;

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
