import axios from "axios";
import { useCallback, useEffect, useState } from "react";

const THINGSBOARD_HOST = "http://161.53.19.19:45080";
const USERNAME = "jakov.sikiric@fer.hr";
const PASSWORD = "IntStvAquaQ";

interface Device {
  id: string;
  name: string;
  type: string;
}

interface Customer {
  id: string;
  name: string;
  toilets: Device[];
  showers: Device[];
}

const Admin = () => {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState("");

  const addCustomer = async () => {
    const token = await loginAndGetToken();
    const customerData = {
      title: newCustomer,
    };
    try {
      const response = await axios.post(
        `${THINGSBOARD_HOST}/api/customer`,
        customerData,
        {
          headers: {
            "X-Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      fetchCustomers();
      resetForm();
    } catch (error) {
      console.error("Failed to save customer:", error);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    const token = await loginAndGetToken();
    try {
      const response = await axios.delete(
        `${THINGSBOARD_HOST}/api/customer/${customerId}`,
        {
          headers: {
            "X-Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setCustomers((customers) => customers.filter((c) => c.id !== customerId));
      fetchCustomers();
      resetForm();
    } catch (error) {
      console.error("Failed to save customer:", error);
    }
  };

  const addDeviceToCustomer = async (
    customerId: string,
    deviceType: string
  ) => {
    const token = await loginAndGetToken();
    const deviceName = prompt(`Enter the name for the new ${deviceType}:`);
    if (!deviceName) return;
    const deviceData = {
      name: deviceName,
      type: deviceType,
      customerId: {
        id: customerId,
        entityType: "CUSTOMER",
      },
    };
    try {
      const response = await axios.post(
        `${THINGSBOARD_HOST}/api/device?accessToken=${token}`,
        deviceData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Authorization": `Bearer ${token}`,
          },
        }
      );
      fetchCustomers();
    } catch (error) {
      console.error(
        "Failed to add device:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const deleteDevice = async (deviceId: string, deviceType: string) => {
    const confirm = window.prompt(
      `Are you sure you want to delete this ${deviceType}? Type 'yes' to confirm.`
    );
    if (confirm !== "yes") {
      return;
    }
    const token = await loginAndGetToken();
    try {
      const response = await axios.delete(
        `${THINGSBOARD_HOST}/api/device/${deviceId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Authorization": `Bearer ${token}`,
          },
        }
      );
      fetchCustomers();
    } catch (error) {
      console.error(
        "Failed to delete device:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const resetForm = () => {
    setNewCustomer("");
  };

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

  const fetchCustomerDevices = async (customerId: string, token: string) => {
    const url = `${THINGSBOARD_HOST}/api/customer/${customerId}/devices?pageSize=100&page=0`;
    const response = await axios.get(url, {
      headers: { "X-Authorization": `Bearer ${token}` },
    });
    const devices = response.data.data.map((device: any) => ({
      id: device.id.id,
      name: device.name,
      type: device.type,
    }));

    const newShowers = devices.filter((d: Device) => d.type === "shower");
    const newToilets = devices.filter((d: Device) => d.type === "toilet");

    return { showers: newShowers, toilets: newToilets };
  };

  const fetchCustomers = useCallback(async () => {
    try {
      const token = await loginAndGetToken();
      const response = await axios.get(
        `${THINGSBOARD_HOST}/api/customers?pageSize=100&page=0`,
        {
          headers: { "X-Authorization": `Bearer ${token}` },
        }
      );
      const customerPromises = response.data.data.map(async (customer: any) => {
        const { showers, toilets } = await fetchCustomerDevices(
          customer.id.id,
          token
        );
        return {
          id: customer.id.id,
          name: customer.name,
          toilets,
          showers,
        };
      });

      const customersData = await Promise.all(customerPromises);
      setCustomers(
        customersData.filter((customer) => customer.name !== "Public")
      );
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  }, []);

  useEffect(() => {
    const customerId = localStorage.getItem("customerId");
    if (customerId) {
      fetchCustomers();
    }
  }, [fetchCustomers]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-white mb-6">Admin Dashboard</h1>
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Customer Name"
          value={newCustomer}
          onChange={(e) => setNewCustomer(e.target.value)}
          className="flex-1 p-3 bg-gray-800 text-white rounded"
        />
        <button
          onClick={addCustomer}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
        >
          Add Customer
        </button>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Customer List</h2>
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="bg-gray-800 p-4 rounded mb-4 shadow-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{customer.name}</h3>
              <button
                onClick={() => deleteCustomer(customer.id)}
                className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
              >
                Delete Customer
              </button>
            </div>
            <div className="mb-4">
              <p className="font-semibold text-white">
                Toilets: {customer.toilets?.length}
              </p>
              <div className="grid grid-flow-row gap-2">
                {customer.toilets?.map((toilet) => (
                  <div
                    key={toilet.id}
                    className="flex justify-between items-center bg-gray-700 p-2 rounded"
                  >
                    {toilet.name}
                    <button
                      onClick={() => deleteDevice(toilet.id, "toilet")}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="font-semibold text-white">
                Showers: {customer.showers?.length}
              </p>
              <div className="grid grid-flow-row gap-2">
                {customer.showers?.map((shower) => (
                  <div
                    key={shower.id}
                    className="flex justify-between items-center bg-gray-700 p-2 rounded"
                  >
                    {shower.name}
                    <button
                      onClick={() => deleteDevice(shower.id, "shower")}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addDeviceToCustomer(customer.id, "shower")}
                className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
              >
                Add Shower
              </button>
              <button
                onClick={() => addDeviceToCustomer(customer.id, "toilet")}
                className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
              >
                Add Toilet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
