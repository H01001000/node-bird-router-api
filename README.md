# Node Bird Router API

Example
```ts
// initialise the API
const bird = new Bird();

// Connect to the socket
await bird.connect();

// Send the show route command
const resp = await bird.sendCommand("show route");

console.log(resp)
// Table master4:
// 172.20.222.0/27 unreachable [static3 12-20] * (200)
// Table master6:
// fd7b:1b70:2d2e::/48 unreachable [static4 12-20] * (200)
// Table dn42_roa:
// 172.23.37.192/27-29 AS51 [static1 12-20] * (200)
// 10.231.0.0/16-24 AS9 [static1 12-20] * (200)
// 10.118.128.0/18-24 AS3 [static1 12-20] * (200)
// 172.22.130.32/27-29 AS22 [static1 12-20] * (200)
```