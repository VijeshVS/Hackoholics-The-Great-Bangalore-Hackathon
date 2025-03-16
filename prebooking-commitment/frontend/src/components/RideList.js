"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import useAuthStore from "@/store/authStore";
import api from "@/utils/api";
import CancellationModal from "./CancellationModal";
import AcceptRideModal from "./AcceptRideModal";
import {
  locations,
  calculateDistance,
  calculateFare,
  getAvailableDestinations,
  calculateCommitmentFee,
} from "@/utils/locations";

export default function RideList() {
  const { user, refreshUser } = useAuthStore();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingType, setBookingType] = useState("POINT_TO_POINT");
  const [selectedRide, setSelectedRide] = useState(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [pointToPoint, setPointToPoint] = useState({
    pickup: "",
    destination: "",
    scheduledTime: "",
  });
  const [hourly, setHourly] = useState({
    pickup: "",
    hours: 1,
    scheduledTime: "",
  });
  const [historyFilter, setHistoryFilter] = useState("ALL");

  // Calculate available destinations based on selected pickup
  const availableDestinations = pointToPoint.pickup
    ? getAvailableDestinations(pointToPoint.pickup)
    : [];

  // Calculate fare and commitment fee
  const calculateTotalFare = () => {
    if (
      bookingType === "POINT_TO_POINT" &&
      pointToPoint.pickup &&
      pointToPoint.destination
    ) {
      const distance = calculateDistance(
        pointToPoint.pickup,
        pointToPoint.destination
      );
      const fare = calculateFare("distance", distance);
      const commitmentFee = calculateCommitmentFee(fare);
      return { fare, commitmentFee, distance, hours: 0 };
    } else if (bookingType === "HOURLY" && hourly.hours > 0) {
      const fare = calculateFare("hourly", hourly.hours);
      const commitmentFee = calculateCommitmentFee(fare);
      return { fare, commitmentFee, distance: 0, hours: hourly.hours };
    }
    return { fare: 0, commitmentFee: 0, distance: 0, hours: 0 };
  };

  const { fare, commitmentFee, distance, hours } = calculateTotalFare();

  // Fetch rides
  const fetchRides = async () => {
    try {
      const response = await api.get("/api/rides");
      // Process rides to ensure refund amounts are properly set
      const processedRides = response.data.map((ride) => {
        // Find relevant transactions
        const refundTransaction = ride.transactions?.find(
          (t) => t.type === "REFUND"
        );
        const commissionTransaction = ride.transactions?.find(
          (t) => t.type === "COMMISSION"
        );
        const convenienceTransaction = ride.transactions?.find(
          (t) =>
            t.type === "CREDIT" && t.description.includes("Convenience fee")
        );
        const debitTransaction = ride.transactions?.find(
          (t) => t.type === "DEBIT"
        );
        const creditTransaction = ride.transactions?.find(
          (t) =>
            t.type === "CREDIT" && !t.description.includes("Convenience fee")
        );

        // Get platform fee percentage from ride data or use default
        const platformFeePercentage =
          ride.platformFeePercentage ||
          ride.cancellationDetails?.platformFeePercentage ||
          0.1;
        const convenienceFeePercentage =
          ride.convenienceFeePercentage ||
          ride.cancellationDetails?.convenienceFeePercentage ||
          0.9;

        // Calculate financial summaries based on ride status
        let driverEarnings = 0;
        let passengerPayment = 0;
        let financialSummary = "";

        if (ride.status === "COMPLETED") {
          // For completed rides
          if (user?.role === "driver") {
            // Driver gets: fare + passenger commitment fee + driver commitment fee refund + bonus
            const bonusAmount = Number(ride.driverBonus || 0);
            driverEarnings =
              Number(ride.fare) +
              Number(ride.commitmentFee) +
              Number(ride.commitmentFee) +
              bonusAmount;
            financialSummary = `Fare (${formatCurrency(
              ride.fare
            )}) + Passenger CF (${formatCurrency(
              ride.commitmentFee
            )}) + Your CF refund (${formatCurrency(ride.commitmentFee)})${
              bonusAmount > 0 ? ` + Bonus (${formatCurrency(bonusAmount)})` : ""
            }`;
          } else {
            // Passenger pays: fare (commitment fee is already paid)
            passengerPayment = Number(ride.fare) + Number(ride.commitmentFee);
            financialSummary = `Fare (${formatCurrency(
              ride.fare
            )}) + Commitment Fee (${formatCurrency(ride.commitmentFee)})`;
          }
        } else if (ride.status === "CANCELLED") {
          // For cancelled rides, use the existing logic
          let refundAmount = 0;
          let actualRefundAmount = 0;

          if (user?.role === "passenger") {
            // If no driver has accepted yet, provide full refund
            if (!ride.driver) {
              refundAmount = ride.commitmentFee;
              actualRefundAmount = ride.commitmentFee;
            } else {
              // For passenger with driver, show the actual refund amount they received
              refundAmount =
                ride.cancellationDetails?.passengerRefundAmount ||
                (refundTransaction ? Number(refundTransaction.amount) : 0);

              // The actual refund might include convenience fee if driver cancelled
              if (ride.cancellationDetails?.cancelledBy === "driver") {
                const convFee =
                  ride.cancellationDetails?.passengerConvenienceFee ||
                  (convenienceTransaction
                    ? Number(convenienceTransaction.amount)
                    : 0);
                actualRefundAmount = refundAmount + convFee;
              } else {
                actualRefundAmount = refundAmount;
              }
            }
          } else if (user?.role === "driver") {
            // For driver, show the amount they lost (commitment fee - refund)
            const driverRefund =
              ride.cancellationDetails?.driverRefundAmount ||
              (refundTransaction ? Number(refundTransaction.amount) : 0);

            // If driver cancelled, they lose the penalty amount
            if (ride.cancellationDetails?.cancelledBy === "driver") {
              refundAmount = driverRefund;
              actualRefundAmount = driverRefund;
            } else {
              // If passenger cancelled, driver gets refund + convenience fee
              const convFee =
                ride.cancellationDetails?.driverConvenienceFee ||
                (convenienceTransaction
                  ? Number(convenienceTransaction.amount)
                  : 0);
              refundAmount = driverRefund;
              actualRefundAmount = driverRefund + convFee;
            }
          }

          // Calculate penalty amount
          let penaltyAmount = ride.cancellationDetails?.penaltyAmount || 0;

          // If no driver has accepted yet, no platform fee should be charged
          if (!ride.driver && user?.role === "passenger") {
            penaltyAmount = 0;
          }

          // Determine convenience fee based on user role
          let convenienceFee = 0;
          if (
            user?.role === "passenger" &&
            ride.cancellationDetails?.cancelledBy === "driver"
          ) {
            convenienceFee =
              ride.cancellationDetails?.passengerConvenienceFee ||
              (convenienceTransaction
                ? Number(convenienceTransaction.amount)
                : 0);
          } else if (
            user?.role === "driver" &&
            ride.cancellationDetails?.cancelledBy === "passenger"
          ) {
            convenienceFee =
              ride.cancellationDetails?.driverConvenienceFee ||
              (convenienceTransaction
                ? Number(convenienceTransaction.amount)
                : 0);
          }

          return {
            ...ride,
            refundAmount,
            actualRefundAmount,
            convenienceFee,
            penaltyAmount,
            commissionAmount: commissionTransaction
              ? Number(commissionTransaction.amount)
              : ride.cancellationDetails?.platformCommission
              ? Number(ride.cancellationDetails.platformCommission)
              : !ride.driver && user?.role !== "passenger"
              ? ride.commitmentFee * platformFeePercentage
              : 0,
            platformFeePercentage,
            convenienceFeePercentage,
          };
        }

        return {
          ...ride,
          driverEarnings,
          passengerPayment,
          financialSummary,
          // Keep existing fields for cancelled rides
          refundAmount: refundTransaction
            ? Number(refundTransaction.amount)
            : 0,
          actualRefundAmount: 0, // Will be calculated for cancelled rides
          convenienceFee: convenienceTransaction
            ? Number(convenienceTransaction.amount)
            : 0,
          penaltyAmount: ride.cancellationDetails?.penaltyAmount || 0,
          commissionAmount: commissionTransaction
            ? Number(commissionTransaction.amount)
            : 0,
          platformFeePercentage,
          convenienceFeePercentage,
        };
      });
      setRides(processedRides);
    } catch (error) {
      console.error("Failed to fetch rides:", error);
    }
  };

  // Set up periodic refresh for rides
  useEffect(() => {
    fetchRides();
    const interval = setInterval(fetchRides, 10000);
    return () => clearInterval(interval);
  }, []);

  // Book a new ride
  const handleBookRide = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rideData =
        bookingType === "POINT_TO_POINT"
          ? {
              bookingType,
              pickup: pointToPoint.pickup,
              destination: pointToPoint.destination,
              distance,
              scheduledTime: pointToPoint.scheduledTime,
              fare,
              commitmentFee,
            }
          : {
              bookingType,
              pickup: hourly.pickup,
              hours: hourly.hours,
              scheduledTime: hourly.scheduledTime,
              fare,
              commitmentFee,
            };

      await api.post("/api/rides", rideData);

      // Update rides list and user data (for updated wallet balance)
      await Promise.all([fetchRides(), refreshUser()]);

      toast.success("Ride booked successfully!");

      // Reset form
      if (bookingType === "POINT_TO_POINT") {
        setPointToPoint({ pickup: "", destination: "", scheduledTime: "" });
      } else {
        setHourly({ pickup: "", hours: 1, scheduledTime: "" });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to book ride");
    } finally {
      setLoading(false);
    }
  };

  // Accept a ride (for drivers)
  const handleAcceptRide = (ride) => {
    setSelectedRide(ride);
    setShowAcceptModal(true);
  };

  // Start a ride (for drivers)
  const handleStartRide = async (rideId) => {
    try {
      await api.put(`/api/rides/${rideId}/start`);
      await Promise.all([fetchRides(), refreshUser()]);
      toast.success("Ride started!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start ride");
    }
  };

  // Complete a ride
  const handleCompleteRide = async (rideId) => {
    try {
      const response = await api.put(`/api/rides/${rideId}/complete`);
      await Promise.all([fetchRides(), refreshUser()]);

      // Show success toast with bonus information if applicable
      if (response.data.driverBonus > 0) {
        toast.success(
          <div>
            <div>Ride completed successfully!</div>
            <div className="text-sm mt-1">
              You earned a bonus of {formatCurrency(response.data.driverBonus)}{" "}
              for completing this ride!
            </div>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.success("Ride completed!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete ride");
    }
  };

  // Open cancellation modal
  const handleOpenCancellation = (ride) => {
    setSelectedRide(ride);
    setShowCancellationModal(true);
  };

  // Handle successful cancellation
  const handleCancellationSuccess = async () => {
    await Promise.all([fetchRides(), refreshUser()]);
    setShowCancellationModal(false);
    setSelectedRide(null);
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₹0";
    const value = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {user?.role === "passenger" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex gap-4 mb-6">
            <button
              className={`flex-1 py-2 px-4 rounded-lg ${
                bookingType === "POINT_TO_POINT"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
              onClick={() => setBookingType("POINT_TO_POINT")}
            >
              Point to Point
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-lg ${
                bookingType === "HOURLY"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
              onClick={() => setBookingType("HOURLY")}
            >
              Hourly Rental
            </button>
          </div>

          <form onSubmit={handleBookRide} className="space-y-4">
            {bookingType === "POINT_TO_POINT" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Location
                  </label>
                  <select
                    className="input w-full"
                    value={pointToPoint.pickup}
                    onChange={(e) =>
                      setPointToPoint((prev) => ({
                        ...prev,
                        pickup: e.target.value,
                        destination: "", // Reset destination when pickup changes
                      }))
                    }
                    required
                  >
                    <option value="">Select pickup location</option>
                    {Object.keys(locations).map((loc) => (
                      <option key={loc} value={loc}>
                        {locations[loc].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination
                  </label>
                  <select
                    className="input w-full"
                    value={pointToPoint.destination}
                    onChange={(e) =>
                      setPointToPoint((prev) => ({
                        ...prev,
                        destination: e.target.value,
                      }))
                    }
                    required
                    disabled={!pointToPoint.pickup}
                  >
                    <option value="">Select destination</option>
                    {availableDestinations.map((loc) => (
                      <option key={loc} value={loc}>
                        {locations[loc].name}
                      </option>
                    ))}
                  </select>
                  {pointToPoint.pickup && pointToPoint.destination && (
                    <p className="text-sm text-gray-500 mt-1">
                      Distance: {distance} km (₹15 per km)
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Location
                  </label>
                  <select
                    className="input w-full"
                    value={hourly.pickup}
                    onChange={(e) =>
                      setHourly((prev) => ({
                        ...prev,
                        pickup: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select pickup location</option>
                    {Object.keys(locations).map((loc) => (
                      <option key={loc} value={loc}>
                        {locations[loc].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    className="input w-full"
                    value={hourly.hours}
                    onChange={(e) =>
                      setHourly((prev) => ({
                        ...prev,
                        hours: parseInt(e.target.value),
                      }))
                    }
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">₹250 per hour</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Time
              </label>
              <input
                type="datetime-local"
                className="input w-full"
                value={
                  bookingType === "POINT_TO_POINT"
                    ? pointToPoint.scheduledTime
                    : hourly.scheduledTime
                }
                onChange={(e) => {
                  if (bookingType === "POINT_TO_POINT") {
                    setPointToPoint((prev) => ({
                      ...prev,
                      scheduledTime: e.target.value,
                    }));
                  } else {
                    setHourly((prev) => ({
                      ...prev,
                      scheduledTime: e.target.value,
                    }));
                  }
                }}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-sm mb-2">
                <span>Total Fare:</span>
                <div className="flex items-center gap-4">
                  {bookingType === "POINT_TO_POINT" ? (
                    <span className="text-gray-600">
                      {distance} km × ₹15 = ₹{distance * 15}
                    </span>
                  ) : (
                    <span className="text-gray-600">
                      {hours} hours × ₹250 = ₹{hours * 250}
                    </span>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Pay now (20% commitment fee):</span>
                <span className="text-blue-600">₹{commitmentFee}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Pay after ride (remaining balance):</span>
                <span>₹{fare - commitmentFee}</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span>₹{fare}</span>
              </div>
            </div>

            {/* Commitment Fee Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">
                Payment Information
              </h4>
              <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-yellow-800">
                <li>
                  You'll pay ₹{commitmentFee} now as a commitment fee (20% of
                  total fare)
                </li>
                <li>
                  The remaining ₹{fare - commitmentFee} will be paid after
                  completing the ride
                </li>
                <li>
                  If you cancel the ride, you may lose part or all of your
                  commitment fee based on the cancellation policy
                </li>
              </ul>
              <div className="mt-3 text-xs text-gray-600">
                <strong>Cancellation Rules:</strong>
                <ul className="list-disc list-inside mt-1">
                  <li>
                    Our dynamic cancellation policy uses an exponential
                    algorithm for all cancellations
                  </li>
                  <li>
                    Refund = e^(-2) × (Scheduled Time - Booking Time) / (Current
                    Time - Booking Time)
                  </li>
                  <li>
                    The closer to the scheduled time, the lower the refund
                  </li>
                  <li>The longer you wait to cancel, the lower the refund</li>
                  <li>
                    Full penalty applies at ride time (0 minutes until ride)
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Booking..." : "Book Ride"}
            </button>
          </form>
        </div>
      )}

      {user?.role === "driver" && (
        <div className="space-y-6">
          {/* Information about driver bonus */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-800 font-medium flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Driver Bonus Program
            </h3>
            <p className="text-blue-700 mt-2 text-sm">
              Complete your committed rides to earn a bonus! For every ride you
              complete, you'll receive a 5% bonus on the fare amount, credited
              directly to your wallet from the platform.
            </p>
          </div>

          {/* Available Rides Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Available Rides</h2>
            </div>
            <div className="divide-y">
              {rides
                .filter((ride) => ride.status === "PENDING")
                .map((ride) => (
                  <div key={ride._id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-medium mb-1">
                          {ride.bookingType === "POINT_TO_POINT" ? (
                            <>
                              {ride.pickup} → {ride.destination}
                              <span className="ml-2 text-sm text-gray-500">
                                ({ride.distance} km)
                              </span>
                            </>
                          ) : (
                            <>
                              {ride.pickup}
                              <span className="ml-2 text-sm text-gray-500">
                                ({ride.hours} hours)
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Scheduled for {formatDateTime(ride.scheduledTime)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          {ride.status}
                        </span>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(ride.fare)}
                          </div>
                          <div className="text-sm text-gray-500">
                            CF: {formatCurrency(ride.commitmentFee)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ride Actions */}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleAcceptRide(ride)}
                        className="py-1 px-3 bg-primary text-white text-sm rounded hover:bg-primary-dark"
                      >
                        Accept Ride
                      </button>
                    </div>
                  </div>
                ))}
              {rides.filter((ride) => ride.status === "PENDING").length ===
                0 && (
                <div className="p-6 text-center text-gray-500">
                  No available rides at the moment
                </div>
              )}
            </div>
          </div>

          {/* My Rides History Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">My Ride History</h2>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 text-sm rounded-full ${
                      historyFilter === "ALL"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    onClick={() => setHistoryFilter("ALL")}
                  >
                    All
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-full ${
                      historyFilter === "COMPLETED"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    onClick={() => setHistoryFilter("COMPLETED")}
                  >
                    Completed
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-full ${
                      historyFilter === "CANCELLED_BY_ME"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    onClick={() => setHistoryFilter("CANCELLED_BY_ME")}
                  >
                    Cancelled by Me
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-full ${
                      historyFilter === "CANCELLED_BY_PASSENGER"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    onClick={() => setHistoryFilter("CANCELLED_BY_PASSENGER")}
                  >
                    Cancelled by Passenger
                  </button>
                </div>
              </div>
            </div>
            <div className="divide-y">
              {rides
                .filter((ride) => {
                  // Filter rides that are accepted, in progress, completed, or cancelled
                  // and where the driver is the current user
                  if (ride.status === "PENDING") return false;
                  if (!ride.driver || ride.driver !== user._id) return false;

                  // Apply additional filters based on historyFilter
                  if (historyFilter === "ALL") return true;
                  if (
                    historyFilter === "COMPLETED" &&
                    ride.status === "COMPLETED"
                  )
                    return true;
                  if (
                    historyFilter === "CANCELLED_BY_ME" &&
                    ride.status === "CANCELLED" &&
                    ride.cancellationDetails?.cancelledBy === "driver"
                  )
                    return true;
                  if (
                    historyFilter === "CANCELLED_BY_PASSENGER" &&
                    ride.status === "CANCELLED" &&
                    ride.cancellationDetails?.cancelledBy === "passenger"
                  )
                    return true;

                  return false;
                })
                .map((ride) => (
                  <div key={ride._id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-medium mb-1">
                          {ride.bookingType === "POINT_TO_POINT" ? (
                            <>
                              {ride.pickup} → {ride.destination}
                              <span className="ml-2 text-sm text-gray-500">
                                ({ride.distance} km)
                              </span>
                            </>
                          ) : (
                            <>
                              {ride.pickup}
                              <span className="ml-2 text-sm text-gray-500">
                                ({ride.hours} hours)
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Scheduled for {formatDateTime(ride.scheduledTime)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            ride.status === "ACCEPTED"
                              ? "bg-blue-100 text-blue-800"
                              : ride.status === "IN_PROGRESS"
                              ? "bg-purple-100 text-purple-800"
                              : ride.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {ride.status}
                        </span>
                        {ride.status === "CANCELLED" &&
                          ride.cancellationDetails?.cancelledBy && (
                            <div className="flex items-center">
                              <div
                                className={`px-3 py-1 rounded-md flex items-center ${
                                  ride.cancellationDetails.cancelledBy ===
                                  "passenger"
                                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                                }`}
                              >
                                {ride.cancellationDetails.cancelledBy ===
                                "passenger" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1.5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1.5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h4.05a2.5 2.5 0 014.9 0H20a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                                  </svg>
                                )}
                                <span className="text-xs font-medium">
                                  {ride.cancellationDetails.cancelledBy ===
                                  "passenger"
                                    ? "Passenger cancelled"
                                    : "You cancelled"}
                                </span>
                              </div>
                            </div>
                          )}
                        <div className="text-right">
                          {/* For completed rides, show total earnings */}
                          {ride.status === "COMPLETED" && (
                            <div>
                              <div className="font-medium text-green-600">
                                Total Earnings:{" "}
                                {formatCurrency(ride.driverEarnings)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {ride.financialSummary}
                              </div>
                              {ride.driverBonus > 0 && (
                                <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <svg
                                    className="mr-1.5 h-2 w-2 text-green-400"
                                    fill="currentColor"
                                    viewBox="0 0 8 8"
                                  >
                                    <circle cx="4" cy="4" r="3" />
                                  </svg>
                                  Bonus Reward:{" "}
                                  {formatCurrency(ride.driverBonus)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* For non-completed rides, show the original fare display */}
                          {ride.status !== "COMPLETED" && (
                            <>
                              <div className="font-medium">
                                {formatCurrency(ride.fare)}
                              </div>
                              <div className="text-sm text-gray-500">
                                CF: {formatCurrency(ride.commitmentFee)}
                              </div>
                            </>
                          )}

                          {/* Cancellation information */}
                          {ride.status === "CANCELLED" && (
                            <div className="text-sm text-red-600">
                              {ride.cancellationDetails?.cancelledBy ===
                              "passenger"
                                ? "Passenger cancelled"
                                : "You cancelled"}
                              {ride.cancellationDetails?.reason && (
                                <span className="text-xs ml-1">
                                  ({ride.cancellationDetails.reason})
                                </span>
                              )}
                              {ride.penaltyAmount > 0 &&
                                ride.cancellationDetails?.cancelledBy ===
                                  "driver" && (
                                  <>
                                    <br />
                                    Penalty:{" "}
                                    {formatCurrency(ride.penaltyAmount)}
                                    <span className="text-xs ml-1">
                                      (charged for cancellation)
                                    </span>
                                  </>
                                )}
                            </div>
                          )}

                          {/* Show refund if applicable */}
                          {ride.status === "CANCELLED" &&
                            (ride.cancellationDetails?.cancelledBy !==
                              "driver" ||
                              ride.penaltyAmount === 0) && (
                              <div className="text-sm text-green-600">
                                {ride.cancellationDetails?.cancelledBy ===
                                "passenger"
                                  ? "Total refund received: "
                                  : "Refund: "}
                                {formatCurrency(ride.actualRefundAmount || 0)}
                                {ride.cancellationDetails?.cancelledBy ===
                                  "passenger" &&
                                  ride.convenienceFee > 0 && (
                                    <span className="text-xs ml-1">
                                      (includes compensation)
                                    </span>
                                  )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Ride Actions */}
                    <div className="flex justify-end gap-2">
                      {ride.status === "ACCEPTED" && (
                        <>
                          <button
                            onClick={() => handleStartRide(ride._id)}
                            className="py-1 px-3 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                          >
                            Start Ride
                          </button>
                          <button
                            onClick={() => handleOpenCancellation(ride)}
                            className="py-1 px-3 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Cancel Ride
                          </button>
                        </>
                      )}

                      {ride.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => handleCompleteRide(ride._id)}
                          className="py-1 px-3 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Complete Ride
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              {rides.filter((ride) => {
                if (ride.status === "PENDING") return false;
                if (!ride.driver || ride.driver !== user._id) return false;
                if (historyFilter === "ALL") return true;
                if (
                  historyFilter === "COMPLETED" &&
                  ride.status === "COMPLETED"
                )
                  return true;
                if (
                  historyFilter === "CANCELLED_BY_ME" &&
                  ride.status === "CANCELLED" &&
                  ride.cancellationDetails?.cancelledBy === "driver"
                )
                  return true;
                if (
                  historyFilter === "CANCELLED_BY_PASSENGER" &&
                  ride.status === "CANCELLED" &&
                  ride.cancellationDetails?.cancelledBy === "passenger"
                )
                  return true;
                return false;
              }).length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No rides found for the selected filter
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {user?.role === "passenger" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Your Rides</h2>
          </div>
          <div className="divide-y">
            {rides.map((ride) => (
              <div key={ride._id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-medium mb-1">
                      {ride.bookingType === "POINT_TO_POINT" ? (
                        <>
                          {ride.pickup} → {ride.destination}
                          <span className="ml-2 text-sm text-gray-500">
                            ({ride.distance} km)
                          </span>
                        </>
                      ) : (
                        <>
                          {ride.pickup}
                          <span className="ml-2 text-sm text-gray-500">
                            ({ride.hours} hours)
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Scheduled for {formatDateTime(ride.scheduledTime)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        ride.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : ride.status === "ACCEPTED"
                          ? "bg-blue-100 text-blue-800"
                          : ride.status === "IN_PROGRESS"
                          ? "bg-purple-100 text-purple-800"
                          : ride.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {ride.status}
                    </span>
                    {ride.status === "CANCELLED" &&
                      ride.cancellationDetails?.cancelledBy && (
                        <div className="flex items-center">
                          <div
                            className={`px-3 py-1 rounded-md flex items-center ${
                              ride.cancellationDetails.cancelledBy ===
                              "passenger"
                                ? "bg-orange-50 text-orange-700 border border-orange-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {ride.cancellationDetails.cancelledBy ===
                            "passenger" ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h4.05a2.5 2.5 0 014.9 0H20a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                              </svg>
                            )}
                            <span className="text-xs font-medium">
                              {ride.cancellationDetails.cancelledBy ===
                              "passenger"
                                ? user?.role === "passenger"
                                  ? "You cancelled"
                                  : "Passenger cancelled"
                                : user?.role === "driver"
                                ? "You cancelled"
                                : "Driver cancelled"}
                            </span>
                          </div>
                        </div>
                      )}
                    <div className="text-right">
                      {/* For completed rides, show total earnings/payment */}
                      {ride.status === "COMPLETED" && (
                        <>
                          {user?.role === "driver" ? (
                            <div>
                              <div className="font-medium text-green-600">
                                Total Earnings:{" "}
                                {formatCurrency(ride.driverEarnings)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {ride.financialSummary}
                              </div>
                              {ride.driverBonus > 0 && (
                                <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <svg
                                    className="mr-1.5 h-2 w-2 text-green-400"
                                    fill="currentColor"
                                    viewBox="0 0 8 8"
                                  >
                                    <circle cx="4" cy="4" r="3" />
                                  </svg>
                                  Bonus Reward:{" "}
                                  {formatCurrency(ride.driverBonus)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">
                                Total Payment:{" "}
                                {formatCurrency(ride.passengerPayment)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {ride.financialSummary}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* For non-completed rides, show the original fare display */}
                      {ride.status !== "COMPLETED" && (
                        <>
                          <div className="font-medium">
                            {formatCurrency(ride.fare)}
                          </div>
                          <div className="text-sm text-gray-500">
                            CF: {formatCurrency(ride.commitmentFee)}
                          </div>
                        </>
                      )}

                      {/* Cancellation information - keep existing code */}
                      {ride.status === "CANCELLED" && (
                        <div className="text-sm text-red-600">
                          {ride.cancellationDetails?.cancelledBy === "passenger"
                            ? user?.role === "passenger"
                              ? "You cancelled"
                              : "Passenger cancelled"
                            : ride.cancellationDetails?.cancelledBy === "driver"
                            ? user?.role === "driver"
                              ? "You cancelled"
                              : "Driver cancelled"
                            : "Cancelled"}
                          {ride.cancellationDetails?.reason && (
                            <span className="text-xs ml-1">
                              ({ride.cancellationDetails.reason})
                            </span>
                          )}
                          {ride.penaltyAmount > 0 && (
                            <>
                              <br />
                              {/* Only show penalty to passenger if they were the one who cancelled */}
                              {user?.role === "passenger" &&
                              ride.cancellationDetails?.cancelledBy ===
                                "passenger" ? (
                                <>
                                  Cancellation penalty:{" "}
                                  {formatCurrency(ride.penaltyAmount)}
                                  <span className="text-xs ml-1">
                                    (charged for cancellation)
                                  </span>
                                </>
                              ) : user?.role !== "passenger" &&
                                ride.cancellationDetails?.cancelledBy ===
                                  "driver" ? (
                                <>
                                  Penalty: {formatCurrency(ride.penaltyAmount)}
                                  <span className="text-xs ml-1">
                                    (charged for cancellation)
                                  </span>
                                </>
                              ) : null}
                            </>
                          )}
                        </div>
                      )}

                      {/* Only show refund if the user is not the one who cancelled or if they cancelled but there's no penalty */}
                      {((user?.role === "passenger" &&
                        (ride.cancellationDetails?.cancelledBy !==
                          "passenger" ||
                          ride.penaltyAmount === 0)) ||
                        (user?.role === "driver" &&
                          (ride.cancellationDetails?.cancelledBy !== "driver" ||
                            ride.penaltyAmount === 0))) &&
                        ride.status === "CANCELLED" && (
                          <div className="text-sm text-green-600">
                            {user?.role === "passenger"
                              ? ride.cancellationDetails?.cancelledBy ===
                                "driver"
                                ? "Total refund received: "
                                : "Refund received: "
                              : ride.cancellationDetails?.cancelledBy ===
                                "passenger"
                              ? "Total refund received: "
                              : "Refund: "}
                            {formatCurrency(ride.actualRefundAmount || 0)}
                            {!ride.driver && ride.penaltyAmount > 0 && (
                              <span className="text-xs ml-1">
                                (
                                {Math.round(
                                  (1 - (ride.platformFeePercentage || 0.1)) *
                                    100
                                )}
                                %)
                              </span>
                            )}
                            {!ride.driver && ride.penaltyAmount === 0 && (
                              <span className="text-xs ml-1">(100%)</span>
                            )}
                            {user?.role === "passenger" &&
                              ride.cancellationDetails?.cancelledBy ===
                                "driver" &&
                              ride.convenienceFee > 0 && (
                                <span className="text-xs ml-1">
                                  (includes compensation)
                                </span>
                              )}
                            {user?.role === "driver" &&
                              ride.cancellationDetails?.cancelledBy ===
                                "passenger" &&
                              ride.convenienceFee > 0 && (
                                <span className="text-xs ml-1">
                                  (includes compensation)
                                </span>
                              )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Ride Actions */}
                <div className="flex justify-end gap-2">
                  {user?.role === "driver" && ride.status === "PENDING" && (
                    <button
                      onClick={() => handleAcceptRide(ride)}
                      className="py-1 px-3 bg-primary text-white text-sm rounded hover:bg-primary-dark"
                    >
                      Accept Ride
                    </button>
                  )}

                  {user?.role === "driver" &&
                    ride.status === "ACCEPTED" &&
                    ride.driver === user._id && (
                      <>
                        <button
                          onClick={() => handleStartRide(ride._id)}
                          className="py-1 px-3 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                        >
                          Start Ride
                        </button>
                        <button
                          onClick={() => handleOpenCancellation(ride)}
                          className="py-1 px-3 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Cancel Ride
                        </button>
                      </>
                    )}

                  {user?.role === "driver" &&
                    ride.status === "IN_PROGRESS" &&
                    ride.driver === user._id && (
                      <button
                        onClick={() => handleCompleteRide(ride._id)}
                        className="py-1 px-3 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Complete Ride
                      </button>
                    )}

                  {user?.role === "passenger" &&
                    (ride.status === "PENDING" ||
                      ride.status === "ACCEPTED") && (
                      <button
                        onClick={() => handleOpenCancellation(ride)}
                        className="py-1 px-3 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Cancel Ride
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancellationModal && selectedRide && (
        <CancellationModal
          ride={selectedRide}
          isOpen={showCancellationModal}
          onClose={() => {
            setShowCancellationModal(false);
            setSelectedRide(null);
          }}
          userType={user?.role}
          onSuccess={handleCancellationSuccess}
        />
      )}

      {/* Accept Ride Modal */}
      {showAcceptModal && selectedRide && (
        <AcceptRideModal
          ride={selectedRide}
          isOpen={showAcceptModal}
          onClose={() => {
            setShowAcceptModal(false);
            setSelectedRide(null);
          }}
          onSuccess={async () => {
            await Promise.all([fetchRides(), refreshUser()]);
            setShowAcceptModal(false);
            setSelectedRide(null);
            toast.success("Ride accepted successfully!");
          }}
        />
      )}
    </div>
  );
}
