export interface Protocol {
  name: string;
  proto: "Kernel" | "Static" | "BGP" | "Direct" | "Device";
  table: string;
  state: string;
  since: string;
  info: string;
}

export interface ProtocolRoutes {
  imported: number;
  exported: number;
  preferred: number;
}

export interface ProtocolRouteChangeStats {
  received: number | undefined;
  rejected: number | undefined;
  filtered: number | undefined;
  ignored: number | undefined;
  accepted: number | undefined;
}

export interface ProtocolChannel {
  channel: string;
  state: string | undefined;
  table: string | undefined;
  preference: string | undefined;
  inputFilter: string | undefined;
  outputFilter: string | undefined;
  importLimit: string | undefined;
  action: string | undefined;
  routes: ProtocolRoutes;
  routeChangeStats: {
    importUpdates: ProtocolRouteChangeStats;
    importWithdraws: ProtocolRouteChangeStats;
    exportUpdates: ProtocolRouteChangeStats;
    exportWithdraws: ProtocolRouteChangeStats;
  };
  bgpNextHop: string[] | undefined;
}

export interface ProtocolKernelAll extends Protocol {
  proto: "Kernel";
  channels: ProtocolChannel[];
}

export interface ProtocolStaticAll extends Protocol {
  proto: "Static";
  channels: ProtocolChannel[];
}

export interface ProtocolBgpAll extends Protocol {
  proto: "BGP";
  channels: ProtocolChannel[];
  bgp: ProtocolBgp | ProtocolPassiveBgp;
}

export interface ProtocolDirectAll extends Protocol {
  proto: "Direct";
}

export interface ProtocolDeviceAll extends Protocol {
  proto: "Device";
}

export type ProtocolAll =
  | ProtocolKernelAll
  | ProtocolStaticAll
  | ProtocolBgpAll
  | ProtocolDirectAll
  | ProtocolDeviceAll;

export interface BgpCapabilities {
  multiprotocol: {
    afAnnounced: string[];
  };
  routeRefresh: boolean;
  extendedNextHop: {
    ipv6NextHop: string[];
  };
  extendedMessage: boolean;
  gracefulRestart: boolean;
  fourOctetASNumbers: boolean;
  enhancedRefresh: boolean;
  longLivedGracefulRestart: boolean;
}

export interface BgpTimer {
  current: number;
  max: number;
}

export interface ProtocolBgp {
  state: string;
  neighborAddress: string;
  neighborAS: number;
  localAS: number;
  neighborID: string;
  localCapabilities: BgpCapabilities;
  neighborCapabilities: BgpCapabilities;
  session: string[];
  sourceAddress: string;
  holdTimer: BgpTimer;
  keepaliveTimer: BgpTimer;
  sendHoldTimer: BgpTimer;
}

export interface ProtocolPassiveBgp {
  state: string;
  neighborRange: string;
  neighborAS: number;
  localAS: number;
}
