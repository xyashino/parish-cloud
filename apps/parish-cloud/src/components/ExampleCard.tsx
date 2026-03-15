import { useState } from 'react';

export default function ExampleCard() {
  const [count, setCount] = useState(0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg ring-1 ring-slate-200/50 transition hover:shadow-xl">
      <h3 className="text-lg font-semibold text-slate-800">
        React + Tailwind example
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        This card is a React component styled with Tailwind. The button below
        uses React state.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Count: {count}
        </button>
        <button
          type="button"
          onClick={() => setCount(0)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
