import net from 'net';

class Bird {
  private socket: net.Socket;
  private socketPath: string;

  private connected: boolean = false;

  /**
  * Bird socket connection.
  * @constructor
  * @param {Object} options - 
  * @param {string} [options.socketPath="/run/bird/bird.ctl"] - Path to the bird socket. Default is `/run/bird/bird.ctl`
  */
  constructor(options?: { socketPath?: string }) {

    const defaultOptions = {
      socketPath: "/run/bird/bird.ctl"
    }

    this.socketPath = options?.socketPath || defaultOptions.socketPath;
  }

  async connect() {

    this.socket = net.createConnection(this.socketPath);

    return new Promise((resolve, reject) => {
      this.socket.once("data", (data) => {
        if (!data.toString().match(/BIRD [0-9]+\.[0-9]+ ready./)) {
          reject(new Error("Failed to connect to bird socket"));
        }
        this.connected = true;
        resolve(true);
      })
    });
  }

  async sendCommand(command: string) {
    if (!this.connected) {
      throw new Error("Socket is not connected");
    }

    const reposonse = new Promise((resolve) => {
      this.socket.once('data', (data) => {
        resolve(data.toString().replaceAll(/([0-9]{4}(-|\s)?)|(^\s+)/gm, "").replaceAll(/  +/g, " "));
      });
    })

    this.socket.write(command);
    return reposonse;
  }
}

