import type {
  ProtocolRoutes,
  ProtocolRouteChangeStats,
  ProtocolChannel,
  BgpCapabilities,
  BgpTimer,
  ProtocolBgp,
  ProtocolPassiveBgp,
} from "./types.js";

export const protocolRoutesParser = (
  text: string | undefined,
): ProtocolRoutes => {
  const numbers = text
    ? Array.from(text.matchAll(/([0-9]+)/g)).map((m) => parseInt(m[0]))
    : [];
  return {
    imported: numbers[0],
    exported: numbers[1],
    preferred: numbers[2],
  };
};

export const protocolRouteChangeStatsParser = (
  text: string | undefined,
): ProtocolRouteChangeStats => {
  const numbers = text
    ? Array.from(text.matchAll(/([0-9(?:\-\-\-)]+)/g)).map((m) =>
        m[0] === "---" ? undefined : parseInt(m[0]),
      )
    : [];
  return {
    received: numbers[0],
    rejected: numbers[1],
    filtered: numbers[2],
    ignored: numbers[3],
    accepted: numbers[4],
  };
};

export const protocolChannelParser = (text: string): ProtocolChannel => {
  const channel = text.split("\n")[0];
  const state = text.match(/State: ([^\s]+)/)?.at(1);
  const table = text.match(/Table: ([^\s]+)/)?.at(1);
  const preference = text.match(/Preference: ([^\s]+)/)?.at(1);
  const inputFilter = text.match(/Input filter: ([^\s]+)/)?.at(1);
  const outputFilter = text.match(/Output filter: ([^\s]+)/)?.at(1);
  const importLimit = text.match(/Import limit: ([^\s]+)/)?.at(1);
  const action = text.match(/Action: ([^\s]+)/)?.at(1);
  const routesText = text.match(/Routes: ([^\n]+)/)?.at(1);
  const importUpdatesText = text.match(/Import updates: ([^\n]+)/)?.at(1);
  const importWithdrawsText = text.match(/Import withdraws: ([^\n]+)/)?.at(1);
  const exportUpdatesText = text.match(/Export updates: ([^\n]+)/)?.at(1);
  const exportWithdrawsText = text.match(/Export withdraws: ([^\n]+)/)?.at(1);
  const bgpNextHop = text
    .match(/BGP Next hop: ([^\n]+)/)
    ?.at(1)
    ?.split(" ");

  const routes = protocolRoutesParser(routesText);
  const routeChangeStats = {
    importUpdates: protocolRouteChangeStatsParser(importUpdatesText),
    importWithdraws: protocolRouteChangeStatsParser(importWithdrawsText),
    exportUpdates: protocolRouteChangeStatsParser(exportUpdatesText),
    exportWithdraws: protocolRouteChangeStatsParser(exportWithdrawsText),
  };

  return {
    channel,
    state,
    table,
    preference,
    inputFilter,
    outputFilter,
    importLimit,
    action,
    routes,
    routeChangeStats,
    bgpNextHop,
  };
};

export const protcoolCapabilitiesParser = (text: string): BgpCapabilities => {
  return {
    multiprotocol: {
      afAnnounced:
        text
          .match(/AF announced: ([a-z0-9 ]+)/)
          ?.at(1)!
          .split(" ") ?? [],
    },
    routeRefresh: text.includes("Route refresh"),
    extendedNextHop: {
      ipv6NextHop:
        text
          .match(/IPv6 nexthop: ([^\s]+)/)
          ?.at(1)!
          .split(" ") ?? [],
    },
    extendedMessage: text.includes("Extended message"),
    gracefulRestart: text.includes("Graceful restart"),
    fourOctetASNumbers: text.includes("4-octet AS numbers"),
    enhancedRefresh: text.includes("Enhanced refresh"),
    longLivedGracefulRestart: text.includes("Long-lived graceful restart"),
  };
};

export const protocolBgpTimerParser = (text: string): BgpTimer => {
  if (text === undefined) return text;
  const [current, max] = text.split("/").map((n) => parseFloat(n));
  return { current, max };
};

export const protocolBgpParser = (
  text: string | undefined,
): ProtocolBgp | undefined => {
  if (text === undefined) return text;

  const state = text.split("\n")[0];
  const neighborAddress = text.match(/Neighbor address: ([^\s]+)/)![1];
  const neighborAS = parseInt(text.match(/Neighbor AS: ([0-9]+)/)![1]);
  const localAS = parseInt(text.match(/Local AS: ([0-9]+)/)![1]);
  const neighborID = text.match(/Neighbor ID: ([^\s]+)/)![1];
  const localCapabilities = protcoolCapabilitiesParser(
    text.match(/Local capabilities\n(.|\n)+?(?=Neighbor capabilities)/)![0],
  );
  const neighborCapabilities = protcoolCapabilitiesParser(
    text.match(/Neighbor capabilities\n(.|\n)+?(?=Session:)/)![0],
  );
  const session = text.match(/Session: ([^\n]+)/)![1].split(" ");
  const sourceAddress = text.match(/Source address: ([^\s]+)/)![1];
  const holdTimer = protocolBgpTimerParser(
    text.match(/Hold timer: ([0-9./]+)/)![1],
  );
  const keepaliveTimer = protocolBgpTimerParser(
    text.match(/Keepalive timer: ([0-9./]+)/)![1],
  );
  const sendHoldTimer = protocolBgpTimerParser(
    text.match(/Send hold timer: ([0-9./]+)/)![1],
  );

  return {
    state,
    neighborAddress,
    neighborAS,
    localAS,
    neighborID,
    localCapabilities,
    neighborCapabilities,
    session,
    sourceAddress,
    holdTimer,
    keepaliveTimer,
    sendHoldTimer,
  };
};

export const protocolPassiveBgpParser = (
  text: string | undefined,
): ProtocolPassiveBgp | undefined => {
  if (text === undefined) return text;

  const state = text.split("\n")[0];
  const neighborRange = text.match(/Neighbor range: ([^\s]+)/)![1];
  const neighborAS = parseInt(text.match(/Neighbor AS: ([0-9]+)/)![1]);
  const localAS = parseInt(text.match(/Local AS: ([0-9]+)/)![1]);

  return {
    state,
    neighborRange,
    neighborAS,
    localAS,
  };
};
