import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

const THINGSBOARD_HOST = "http://161.53.19.19:45080";
const USERNAME = "jakov.sikiric@fer.hr";
const PASSWORD = "IntStvAquaQ";

function CustomerIdInput({customers}) {
  const [customerId, setCustomerId] = useState('');

  const handleSubmit = () => {
    if (customerId) {
      localStorage.setItem('customerId', customerId);
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className='text-3xl font-extrabold mb-10'>AquaQ</h1>
      <input
        type="text"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
        placeholder="Enter your Customer ID"
        className="text-gray-800 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ minWidth: '300px' }}
      />
      <button 
        onClick={handleSubmit}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer shadow"
      >
        Submit
      </button>
      <div className='text-xl text-left mt-20'>
        Customers
      </div>
      
      <div className='text-white'>
        {customers?.map((customer) => (
          <div>
            {customer.id.id}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CustomerIdInput;
