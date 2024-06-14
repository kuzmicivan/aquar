import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useCallback, useEffect, useState } from "react";
import CustomerIdInput from "../components/CustomerIdInput";
import Link from "next/link";
import axios from "axios";

const THINGSBOARD_HOST = "http://161.53.19.19:45080";
const USERNAME = "jakov.sikiric@fer.hr";
const PASSWORD = "IntStvAquaQ";

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customers, setCustomers] = useState([]);


  useEffect(() => {
    const storedCustomerId = localStorage.getItem("customerId");
    if (storedCustomerId) {
      setCustomerId(storedCustomerId);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("customerId");
    setCustomerId(null);
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

  const fetchCustomers = useCallback(async () => {
    try {
      const token = await loginAndGetToken();
      const response = await axios.get(
        `${THINGSBOARD_HOST}/api/customers?pageSize=100&page=0`,
        {
          headers: { "X-Authorization": `Bearer ${token}` },
        }
      );
      setCustomers(response.data.data)
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [])

  if (!customerId) {
    return <CustomerIdInput customers={customers}/>;
  }

  return (
    <div className="relative min-h-screen">
      <nav className="w-full flex justify-end p-4">
        <Link
          href="/admin"
          className="text-white bg-blue-500 hover:bg-blue-700 transition-colors duration-300 px-4 py-2 rounded shadow"
        >
          Admin
        </Link>
        <button
          onClick={handleLogout}
          className="ml-4 bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded cursor-pointer shadow"
        >
          Switch customer
        </button>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
