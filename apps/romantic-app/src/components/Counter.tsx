import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">React Counter Example</h2>
      <div className="text-6xl font-bold text-pink-600 mb-8">{count}</div>
      <div className="flex gap-4">
        <button
          onClick={() => setCount(count - 1)}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
        >
          Decrement
        </button>
        <button
          onClick={() => setCount(0)}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(count + 1)}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
        >
          Increment
        </button>
      </div>
      <p className="mt-6 text-sm text-gray-600">
        This component uses React hooks (useState) and Tailwind CSS styling
      </p>
    </div>
  );
}
