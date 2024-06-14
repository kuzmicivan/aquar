import axios from "axios";
import { useCallback, useEffect, useState } from "react";

const THINGSBOARD_HOST = "http://161.53.19.19:45080";
const USERNAME = "jakov.sikiric@fer.hr";
const PASSWORD = "IntStvAquaQ";

interface Device {
  id: string;
  name: string;
  status: string;
}

const ToiletGrid = () => {
  const [toilets, setToilets] = useState<Device[]>([]);
  const [showers, setShowers] = useState<Device[]>([]);
  const [customer, setCustomer] = useState("");

  const loginAndGetToken = async () => {
    const response = await axios.post(
      `${THINGSBOARD_HOST}/api/auth/login`,
      {
        username: USERNAME,
        password: PASSWORD,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data.token;
  };

  const fetchDeviceStatus = async (id: string, token: string) => {
    const endTs = new Date().getTime();
    const startTs = endTs - 3600000;
    const url = `${THINGSBOARD_HOST}/api/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=isLocked&startTs=${startTs}&endTs=${endTs}`;

    const response = await axios.get(url, {
      headers: { "X-Authorization": `Bearer ${token}` },
    });

    return response.data.isLocked?.[0]?.value === "true" ? "busy" : "available";
  };

  const fetchDevices = useCallback(async (customerId: string) => {
    try {
      const token = await loginAndGetToken();
      const response = await axios.get(
        `${THINGSBOARD_HOST}/api/customer/${customerId}/devices?pageSize=100&page=0`,
        {
          headers: { "X-Authorization": `Bearer ${token}` },
        }
      );

      const customerReponse = await axios.get(
        `${THINGSBOARD_HOST}/api/customer/${customerId}`,
        {
          headers: { "X-Authorization": `Bearer ${token}` },
        }
      );
      
      setCustomer(customerReponse.data.name)


      const devicePromises = response.data.data.map(async (device) => ({
        id: device.id.id,
        name: device.name,
        type: device.type,
        status: await fetchDeviceStatus(device.id.id, token),
      }));

      const devices = await Promise.all(devicePromises);
      const newShowers = devices.filter((d) => d.type === "shower");
      const newToilets = devices.filter((d) => d.type === "toilet");

      setShowers(newShowers);
      setToilets(newToilets);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
  }, []);

  useEffect(() => {
    const customerId = localStorage.getItem("customerId");
    if (customerId) {
      fetchDevices(customerId);
    }
  }, [fetchDevices]);

  return (
    <div className="gap-4 px-8 py-4">
      <div className="flex gap-2">
        <h1 className="text-2xl font-bold text-gray-200 mb-4">Customer</h1>
        <h1 className="text-2xl font-bold text-purple-500 mb-4">{customer}</h1>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-200 mb-4">Toilets</h1>
        <div className="grid grid-flow-col auto-cols-max gap-4">
          {toilets.map((toilet) => (
            <div
              key={toilet.id}
              className={`p-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg ${
                toilet.status === "busy"
                  ? "bg-red-500 hover:bg-red-700"
                  : "bg-green-500 hover:bg-green-700"
              }`}
              style={{ minWidth: "120px" }}
            >
              <div className="text-white text-center font-medium">
                {toilet.name}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10">
        <h1 className="text-2xl font-bold text-gray-200 mb-4">Showers</h1>
        <div className="grid grid-flow-col auto-cols-max gap-4">
          {showers.map((shower) => (
            <div
              key={shower.id}
              className={`p-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg ${
                shower.status === "busy"
                  ? "bg-red-500 hover:bg-red-700"
                  : "bg-green-500 hover:bg-green-700"
              }`}
              style={{ minWidth: "120px" }}
            >
              <div className="text-white text-center font-medium">
                {shower.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToiletGrid;
