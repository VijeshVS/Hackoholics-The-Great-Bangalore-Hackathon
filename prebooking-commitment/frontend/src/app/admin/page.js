"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [transactions, setTransactions] = useState([]);
  const [rides, setRides] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRides: 0,
    totalUsers: 0,
    totalCommission: 0,
    recentTransactions: [],
  });
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const isAdmin = sessionStorage.getItem("isAdmin");
      if (!isAdmin) {
        router.push("/admin/login");
      }
    };
    checkAuth();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = {
        email: "admin1@gmail.com",
        password: "1234",
      };

      const [transRes, ridesRes, statsRes, commissionsRes] = await Promise.all([
        fetch("http://localhost:5000/api/admin/transactions", {
          headers,
          query: { includeRefunds: true },
        }),
        fetch("http://localhost:5000/api/admin/rides", {
          headers,
          query: { populate: "transactions" },
        }),
        fetch("http://localhost:5000/api/admin/stats", { headers }),
        fetch("http://localhost:5000/api/admin/commissions", { headers }),
      ]);

      if (!transRes.ok || !ridesRes.ok || !statsRes.ok || !commissionsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const transData = await transRes.json();
      const processedTransactions = transData.map((transaction) => {
        if (transaction.type === "REFUND") {
          return {
            ...transaction,
            amount: Number(transaction.amount),
          };
        }
        return transaction;
      });

      setTransactions(processedTransactions);

      const ridesData = await ridesRes.json();
      const processedRides = ridesData.map((ride) => {
        const refundTransaction = ride.transactions?.find(
          (t) => t.type === "REFUND"
        );
        return {
          ...ride,
          refundAmount: refundTransaction
            ? Number(refundTransaction.amount)
            : 0,
        };
      });

      setRides(processedRides);

      const statsData = await statsRes.json();
      const commissionsData = await commissionsRes.json();

      setStats(statsData);
      setCommissions(commissionsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      router.push("/admin/login");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Tab navigation handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Admin Dashboard
        </h1>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => handleTabChange("overview")}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleTabChange("commissions")}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "commissions"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Platform Commissions
            </button>
            <button
              onClick={() => handleTabChange("transactions")}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "transactions"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => handleTabChange("rides")}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "rides"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Rides
            </button>
          </nav>
        </div>

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Transactions
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalTransactions}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Rides
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalRides}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Users
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Commission
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(stats.totalCommission)}
                </p>
              </div>
            </div>

            {/* Recent Activity Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Recent Activity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">
                    Latest Transactions
                  </h3>
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((trans) => (
                      <div
                        key={trans._id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full mr-2 ${
                              trans.type === "CREDIT"
                                ? "bg-green-100 text-green-800"
                                : trans.type === "DEBIT"
                                ? "bg-red-100 text-red-800"
                                : trans.type === "REFUND"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {trans.type}
                          </span>
                          <span className="text-sm">{trans.description}</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(trans.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3">Latest Rides</h3>
                  <div className="space-y-3">
                    {rides.slice(0, 5).map((ride) => (
                      <div
                        key={ride._id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {ride.pickup} → {ride.destination || "Hourly"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(ride.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            ride.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : ride.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : ride.status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {ride.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Platform Commissions Tab Content */}
        {activeTab === "commissions" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Platform Commissions
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ride Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissions.map((commission) => {
                      // Find the associated ride for more details
                      const relatedRide = rides.find(
                        (ride) => ride._id === commission.rideId
                      );

                      // Get user information based on source
                      let userName = "Unknown";
                      let userRole =
                        commission.source?.toLowerCase() || "unknown";

                      if (relatedRide) {
                        if (userRole === "passenger") {
                          userName = relatedRide.passenger?.name || "Passenger";
                        } else if (userRole === "driver") {
                          userName = relatedRide.driver?.name || "Driver";
                        }
                      }

                      // Create a readable ride summary
                      const rideDetails = relatedRide
                        ? `${relatedRide.pickup} → ${
                            relatedRide.destination || "Hourly"
                          } (${relatedRide.status})`
                        : "-";

                      return (
                        <tr key={commission._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={
                                commission.amount < 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              {formatCurrency(commission.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                commission.type === "CANCELLATION"
                                  ? "bg-red-100 text-red-800"
                                  : commission.amount < 0
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {commission.amount < 0
                                ? "EXPENSE"
                                : commission.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {userName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                userRole === "passenger"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {userRole.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {rideDetails}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {commission.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(commission.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab Content */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Transactions
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ride Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((trans) => {
                      // Find the associated ride for more details
                      const relatedRide = rides.find(
                        (ride) =>
                          ride._id === (trans.rideId?._id || trans.rideId)
                      );

                      // Determine From/To based on transaction type
                      let fromEntity = "System";
                      let toEntity = "System";

                      if (trans.type === "DEBIT") {
                        fromEntity =
                          relatedRide?.passenger?.name || "Passenger";
                        toEntity = "Platform";
                      } else if (trans.type === "CREDIT") {
                        fromEntity = "Platform";
                        toEntity = relatedRide?.driver?.name || "Driver";
                      } else if (trans.type === "REFUND") {
                        fromEntity = "Platform";
                        toEntity = trans.description
                          .toLowerCase()
                          .includes("driver")
                          ? relatedRide?.driver?.name || "Driver"
                          : relatedRide?.passenger?.name || "Passenger";
                      } else if (trans.type === "COMMITMENT_FEE") {
                        fromEntity = trans.description
                          .toLowerCase()
                          .includes("driver")
                          ? relatedRide?.driver?.name || "Driver"
                          : relatedRide?.passenger?.name || "Passenger";
                        toEntity = "Platform (Escrow)";
                      }

                      // Create a readable ride summary
                      const rideDetails = relatedRide
                        ? `${relatedRide.pickup} → ${
                            relatedRide.destination || "Hourly"
                          } (${relatedRide.status})`
                        : "-";

                      return (
                        <tr key={trans._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                trans.type === "CREDIT"
                                  ? "bg-green-100 text-green-800"
                                  : trans.type === "DEBIT"
                                  ? "bg-red-100 text-red-800"
                                  : trans.type === "REFUND"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {trans.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(trans.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {trans.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {fromEntity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {toEntity}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {rideDetails}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(trans.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Rides Tab Content */}
        {activeTab === "rides" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Rides
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Passenger
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fare
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distance/Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rides.map((ride) => (
                      <tr key={ride._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ride._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ride.passenger?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ride.driver?.name || "Unassigned"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ride.pickup}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ride.destination || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ride.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : ride.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : ride.status === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {ride.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(ride.fare)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ride.bookingType === "POINT_TO_POINT"
                            ? `${ride.distance} km`
                            : `${ride.hours} hrs`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ride.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
