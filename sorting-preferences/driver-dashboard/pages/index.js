import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-8">Ride Matching Simulation</h1>
        <p className="text-xl mb-12">A demonstration of ride matching algorithm</p>
        
        <div className="md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Driver Section</h2>
            <p className="mb-6">Add drivers and set their preferences</p>
            <button
              onClick={() => router.push('/driver/dashboard')}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Driver Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
