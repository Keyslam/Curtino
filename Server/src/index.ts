import express from "express";
import { NextFunction, Request, Response } from "express";
var ping = require("ping");

const app = express();
const port = 8080;

type DeviceIP = string;
type DeviceID = string;

const registeredDevices: Map<DeviceID, DeviceIP> = new Map();

const respond = (res: Response, statusCode: number, data: any = {}): void => {
  data.success = statusCode == 200;

  res.setHeader("Content-Type", "application/json");
  res.status(statusCode);
  res.json(data);
};

const errorHandler = async (
  _err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  respond(res, 500);
};

const cleanupDevices = (): void => {
  registeredDevices.forEach((deviceIP, deviceID) => {
    ping.sys.probe(deviceIP, (isAlive: boolean) => {
      if (!isAlive) {
        console.log(`${deviceIP} dead`);
        registeredDevices.delete(deviceID);
      }
    });
  });
};

app.use(express.json());
app.use(errorHandler);

app.post("/registerDevice", (req, res) => {
  let deviceID: DeviceID | undefined = req.body["deviceID"];
  let deviceIP: DeviceIP | undefined = req.body["deviceIP"];

  if (deviceID == undefined || deviceIP == undefined) {
    respond(res, 400);
  } else {
    registeredDevices.set(deviceID, deviceIP);
    console.log(`${deviceIP} registered`);

    respond(res, 200);
  }
});

app.post("/getDeviceIP", (req, res) => {
  let deviceID: DeviceID | undefined = req.body["deviceID"];

  if (deviceID == undefined) {
    respond(res, 400);
  } else {
    let deviceIP: DeviceIP | undefined = registeredDevices.get(deviceID);

    if (deviceIP == undefined) {
      respond(res, 400);
    } else {
      respond(res, 200, {
        deviceIP: deviceIP,
      });
    }
  }
});

setInterval(cleanupDevices, 1000 * 60 * 10); // 10 minutes
//setInterval(cleanupDevices, 1000 * 5); // 5 second

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});