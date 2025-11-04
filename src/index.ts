import net from "net";
import type {
  Protocol,
  ProtocolAll,
  ProtocolDeviceAll,
  ProtocolDirectAll,
  ProtocolKernelAll,
  ProtocolStaticAll,
} from "./types.js";
import {
  protocolBgpParser,
  protocolChannelParser,
  protocolPassiveBgpParser,
} from "./protocolParser.js";
export * from "./types.js";

export class Bird {
  private readonly socket: net.Socket;
  private readonly socketPath: string;

  private connected: boolean = false;
  private socketLock: Array<(value: unknown) => void> | undefined = undefined;

  /**
   * Bird socket connection.
   * @constructor
   * @param {Object} options -
   * @param {string} [options.socketPath="/run/bird/bird.ctl"] - Path to the bird socket. Default is `/run/bird/bird.ctl`
   */
  constructor(options?: { socketPath?: string }) {
    const defaultOptions = {
      socketPath: "/run/bird/bird.ctl",
    };

    this.socketPath = options?.socketPath ?? defaultOptions.socketPath;
    this.socket = new net.Socket();
  }

  async connect(): Promise<boolean> {
    return await new Promise((resolve, reject) => {
      this.socket.on("error", (err) =>
        reject(new Error("Failed to connect to bird socket", { cause: err })),
      );

      this.socket.connect(this.socketPath);

      this.socket.once("data", (data) => {
        if (!data.toString().match(/BIRD [0-9]+(\.[0-9]+){1,2} ready./)) {
          reject(
            new Error("Failed to connect to bird socket", {
              cause: data.toString(),
            }),
          );
        }
        this.connected = true;
        resolve(true);
      });
    });
  }

  async destroy(): Promise<void> {
    this.socket.destroy();
    this.connected = false;
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.connected) {
      throw new Error("Socket is not connected");
    }

    if (this.socketLock !== undefined) {
      await new Promise((resolve) => this.socketLock!.push(resolve));
    } else {
      // Aquire lock
      this.socketLock = [];
    }

    const reposonse = new Promise<string>((resolve) => {
      let resp = "";
      const onData = (data: Buffer): void => {
        resp += data.toString();

        if (data.toString().match(/^[0-9]{4} /m)) {
          resolve(
            resp
              .replaceAll(/^([0-9]{4}(-|\s)?)|(^\s+)/gm, "")
              .replaceAll(/  +/g, " "),
          );
          this.socket.removeListener("data", onData);
          if (this.socketLock!.length > 0) {
            this.socketLock!.shift()!(true);
          } else {
            this.socketLock = undefined;
          }
        }
      };
      this.socket.on("data", onData);
    });

    this.socket.write(command + "\n");
    return await reposonse;
  }

  async showProtocols(options: {
    name: string;
    all: true;
  }): Promise<ProtocolAll>;
  async showProtocols(options: {
    name?: undefined;
    all: true;
  }): Promise<ProtocolAll[]>;
  async showProtocols(options: {
    name?: undefined;
    all?: false;
  }): Promise<Protocol[]>;
  async showProtocols(options: {
    name: string;
    all?: false;
  }): Promise<Protocol>;
  async showProtocols(options?: undefined): Promise<Protocol[]>;
  async showProtocols(options?: {
    name?: string;
    all?: boolean;
  }): Promise<Protocol[] | Protocol | ProtocolAll | ProtocolAll[]> {
    const resp = await this.sendCommand(
      `show protocols ${options?.all ? "all" : ""}`,
    );

    if (!options?.all) {
      const protocols = resp
        .split("\n")
        .slice(1, -2)
        .map((line) => {
          const [name, proto, table, state, since, info] = line.split(" ");
          return {
            name,
            proto: proto as Protocol["proto"],
            table,
            state,
            since,
            info,
          };
        });

      if (options?.name) {
        return protocols[0];
      }
      return protocols;
    }

    const protocolGroups = resp
      .split(
        /([a-zA-Z0-9_]+ +(?:Direct|Device|Static|Kernel|BGP)[ \-a-zA-Z0-9:.%_]+)\n+/gm,
      )
      .slice(1);

    const protocols: ProtocolAll[] = [];
    for (let i = 0; i < protocolGroups.length; i += 2) {
      const [name, proto, table, state, since, info] =
        protocolGroups[i].split(" ");

      const protocol: Protocol = {
        name,
        proto: proto as Protocol["proto"],
        table,
        state,
        since,
        info,
      };

      if (protocol.proto === "Device" || protocol.proto === "Direct") {
        protocols.push(protocol as ProtocolDeviceAll | ProtocolDirectAll);
        continue;
      }

      const protocolWithChannels = {
        ...protocol,
        channels: protocolGroups[i + 1]
          .split("Channel ")
          .slice(1)
          .map((channel) => protocolChannelParser(channel)),
      };

      if (
        protocolWithChannels.proto === "Kernel" ||
        protocolWithChannels.proto === "Static"
      ) {
        protocols.push(
          protocolWithChannels as ProtocolStaticAll | ProtocolKernelAll,
        );
        continue;
      }

      protocols.push({
        ...protocolWithChannels,
        bgp:
          protocolWithChannels.info === "Passive"
            ? protocolPassiveBgpParser(protocolGroups[i + 1])!
            : protocolBgpParser(protocolGroups[i + 1])!,
      });
    }

    if (options?.name) {
      return protocols.find((p) => p.name === options.name)!;
    }
    return protocols;
  }

  async configureCheck(): Promise<boolean> {
    const check = await this.sendCommand(`configure check`);
    if (check.includes("Configuration OK")) {
      return true;
    }
    console.error("Configuration check failed", check);
    return false;
  }

  async configure(): Promise<boolean> {
    const check = await this.configureCheck();
    if (!check) {
      return false;
    }
    const resp = await this.sendCommand(`configure`);
    if (resp.includes("Reconfigured")) {
      return true;
    }
    return false;
  }

  // async showRoute(): Promise<string> {
  //   return await this.sendCommand(`show route`);
  // }
}
