import net from "net";

export class Bird {
  private readonly socket: net.Socket;
  private readonly socketPath: string;

  private connected: boolean = false;

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
    this.socket.connect(this.socketPath);

    return await new Promise((resolve, reject) => {
      this.socket.once("data", (data) => {
        if (!data.toString().match(/BIRD [0-9]+\.[0-9]+ ready./)) {
          reject(new Error("Failed to connect to bird socket"));
        }
        this.connected = true;
        resolve(true);
      });
    });
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.connected) {
      throw new Error("Socket is not connected");
    }

    const reposonse = new Promise<string>((resolve) => {
      this.socket.once("data", (data) => {
        resolve(
          data
            .toString()
            .replaceAll(/([0-9]{4}(-|\s)?)|(^\s+)/gm, "")
            .replaceAll(/  +/g, " "),
        );
      });
    });

    this.socket.write(command);
    return await reposonse;
  }
}
