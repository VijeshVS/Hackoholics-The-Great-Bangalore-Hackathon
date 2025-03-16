"use client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "@/utils/api";

export default function CancellationModal({
  ride,
  isOpen,
  onClose,
  userType,
  onSuccess,
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [penalties, setPenalties] = useState(null);

  const fetchPenalties = async () => {
    try {
      const res = await api.get(
        `/api/rides/${ride._id}/penalties?userType=${userType}`
      );
      // Ensure all required properties have default values
      const penaltiesData = {
        platformFeePercentage: 0.1,
        convenienceFeePercentage: 0.9,
        penaltyAmount: 0,
        platformAmount: 0,
        passengerRefundAmount: ride.commitmentFee,
        driverRefundAmount: ride.commitmentFee,
        passengerConvenienceFee: 0,
        driverConvenienceFee: 0,
        timeThreshold: 0,
        minutesUntilRide: 0,
        ...res.data,
      };

      // If there's a driver and passenger is cancelling, ensure driver convenience fee is calculated
      if (
        ride.driver &&
        userType === "passenger" &&
        penaltiesData.timeThreshold > 0
      ) {
        // Make sure driver convenience fee is properly set
        if (!penaltiesData.driverConvenienceFee) {
          penaltiesData.driverConvenienceFee = Math.round(
            penaltiesData.penaltyAmount * penaltiesData.convenienceFeePercentage
          );
        }

        // Ensure passenger refund amount accounts for the penalty
        penaltiesData.passengerRefundAmount =
          ride.commitmentFee - penaltiesData.penaltyAmount;
      }

      // For drivers, ensure there's always at least a small penalty unless it's very early
      if (
        ride.driver &&
        userType === "driver" &&
        penaltiesData.minutesUntilRide > 0
      ) {
        // Ensure penalty amount is never exactly 0 for drivers (unless it's very early)
        if (penaltiesData.penaltyAmount < 0.01) {
          const minPenalty = Math.max(1, ride.commitmentFee * 0.01); // At least 1% penalty
          penaltiesData.penaltyAmount = minPenalty;
          penaltiesData.platformAmount = Math.round(
            minPenalty * penaltiesData.platformFeePercentage
          );
          penaltiesData.convenienceFee = Math.round(
            minPenalty * penaltiesData.convenienceFeePercentage
          );
          penaltiesData.driverRefundAmount = ride.commitmentFee - minPenalty;
          penaltiesData.passengerConvenienceFee = penaltiesData.convenienceFee;
          penaltiesData.timeThreshold = 0.01; // Small but non-zero threshold
        }
      }

      setPenalties(penaltiesData);
    } catch (error) {
      console.error("Error fetching penalties:", error);
      toast.error("Failed to fetch cancellation details");
      // Set default penalties in case of error
      setPenalties({
        platformFeePercentage: 0.1,
        convenienceFeePercentage: 0.9,
        penaltyAmount: 0,
        platformAmount: 0,
        passengerRefundAmount: ride.commitmentFee,
        driverRefundAmount: ride.commitmentFee,
        passengerConvenienceFee: 0,
        driverConvenienceFee: 0,
        timeThreshold: 0,
        minutesUntilRide: 0,
      });
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/api/rides/${ride._id}/cancel`, {
        reason: reason || "No reason provided",
        cancelledBy: userType,
      });

      toast.success("Ride cancelled successfully");
      onSuccess();
    } catch (error) {
      console.error("Error cancelling ride:", error);
      toast.error(error.response?.data?.message || "Failed to cancel ride");
    } finally {
      setLoading(false);
    }
  };

  // Fetch penalties when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPenalties();
    }
  }, [isOpen, ride._id]);

  // Calculate minutes until ride
  const calculateMinutesUntilRide = () => {
    const now = new Date();
    const scheduledTime = new Date(ride.scheduledTime);
    const diffMs = scheduledTime - now;
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  };

  if (!isOpen) return null;

  const bookingType =
    ride.bookingType === "POINT_TO_POINT"
      ? `${ride.distance}km ride`
      : `${ride.hours}-hour booking`;

  const formatCurrency = (amount) => {
    // Handle NaN, null, or undefined values
    if (isNaN(amount) || amount === null || amount === undefined) {
      return "₹0.00";
    }

    // Convert to number to ensure proper formatting
    const numAmount = Number(amount);

    // Always show at least 2 decimal places for consistency
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: numAmount < 1 ? 4 : 2, // Show up to 4 decimal places for small values
    }).format(numAmount);
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Cancel {bookingType}</h2>

        {/* Scrollable content area */}
        <div className="overflow-y-auto flex-grow pr-2">
          {/* Ride Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">From</p>
                <p className="font-medium">{ride.pickup}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">To</p>
                <p className="font-medium">
                  {ride.destination || "Hourly Booking"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Scheduled Time</p>
                <p className="font-medium">
                  {formatDateTime(ride.scheduledTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Booking Type</p>
                <p className="font-medium">{bookingType}</p>
              </div>
              {ride.driver && ride.status === "ACCEPTED" && (
                <div>
                  <p className="text-sm text-gray-600">Driver Accepted At</p>
                  <p className="font-medium">
                    {formatDateTime(ride.updatedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Policy */}
          {penalties && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Cancellation Details</h3>
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium text-yellow-800">
                  Time until ride:{" "}
                  {penalties?.minutesUntilRide || calculateMinutesUntilRide()}{" "}
                  minutes
                  {(penalties?.minutesUntilRide === 0 ||
                    calculateMinutesUntilRide() === 0) && (
                    <span className="text-red-600 ml-2">
                      (Full penalty applies at ride time)
                    </span>
                  )}
                </p>
                {!ride.driver && userType === "passenger" ? (
                  <p className="text-green-700">
                    ✓ No driver has accepted your ride yet. Full refund will be
                    issued.
                  </p>
                ) : (
                  <>
                    {/* Always show penalty information, even for very small amounts */}
                    {penalties.penaltyAmount > 0 ? (
                      <p className="text-red-600">
                        ⚠️ Cancellation charges will apply:
                      </p>
                    ) : (
                      <p className="text-green-700">
                        ✓ Based on our algorithm, you will receive a full
                        refund.
                      </p>
                    )}
                    <div className="bg-white rounded p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-gray-600">Commitment Fee Paid:</p>
                          <p className="font-medium">
                            {formatCurrency(ride.commitmentFee)}
                          </p>
                        </div>
                        {!ride.driver && (
                          <div>
                            <p className="text-gray-600">
                              Platform Fee (
                              {(penalties.platformFeePercentage || 0.1) * 100}
                              %):
                            </p>
                            <p className="font-medium text-red-600">
                              -
                              {formatCurrency(
                                ride.commitmentFee *
                                  (penalties.platformFeePercentage || 0.1)
                              )}
                            </p>
                          </div>
                        )}
                        {ride.driver && (
                          <>
                            <div>
                              <p className="text-gray-600">Penalty Amount:</p>
                              <p className="font-medium text-red-600">
                                -{formatCurrency(penalties.penaltyAmount || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">
                                Platform Fee (
                                {(penalties.platformFeePercentage || 0.1) * 100}
                                %):
                              </p>
                              <p className="font-medium text-red-600">
                                -{formatCurrency(penalties.platformAmount || 0)}
                              </p>
                            </div>
                            {userType === "passenger" &&
                              penalties.driverConvenienceFee > 0 && (
                                <div>
                                  <p className="text-gray-600">
                                    Driver Compensation (
                                    {(penalties.convenienceFeePercentage ||
                                      0.9) * 100}
                                    %):
                                  </p>
                                  <p className="font-medium text-blue-600">
                                    {formatCurrency(
                                      penalties.driverConvenienceFee || 0
                                    )}
                                    <span className="text-xs ml-1">
                                      (goes to driver)
                                    </span>
                                  </p>
                                </div>
                              )}
                            {userType === "driver" &&
                              penalties.passengerConvenienceFee > 0 && (
                                <div>
                                  <p className="text-gray-600">
                                    Passenger Compensation (
                                    {(penalties.convenienceFeePercentage ||
                                      0.9) * 100}
                                    %):
                                  </p>
                                  <p className="font-medium text-red-600">
                                    -
                                    {formatCurrency(
                                      penalties.passengerConvenienceFee || 0
                                    )}
                                    <span className="text-xs ml-1">
                                      (goes to passenger)
                                    </span>
                                  </p>
                                </div>
                              )}
                          </>
                        )}
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-medium">
                          <span>Refund Amount:</span>
                          <span className="text-green-600">
                            {!ride.driver && userType === "passenger"
                              ? formatCurrency(ride.commitmentFee)
                              : !ride.driver
                              ? formatCurrency(
                                  ride.commitmentFee *
                                    (1 -
                                      (penalties.platformFeePercentage || 0.1))
                                )
                              : formatCurrency(
                                  userType === "passenger"
                                    ? penalties.passengerRefundAmount || 0
                                    : penalties.driverRefundAmount || 0
                                )}
                          </span>
                        </div>
                        {ride.driver &&
                          userType === "passenger" &&
                          penalties.timeThreshold > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              Calculation: {formatCurrency(ride.commitmentFee)}{" "}
                              (commitment) -{" "}
                              {formatCurrency(penalties.penaltyAmount)}{" "}
                              (penalty) ={" "}
                              {formatCurrency(penalties.passengerRefundAmount)}
                            </div>
                          )}
                        {ride.driver &&
                          userType === "driver" &&
                          penalties.timeThreshold > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              Calculation: {formatCurrency(ride.commitmentFee)}{" "}
                              (commitment) -{" "}
                              {formatCurrency(penalties.penaltyAmount)}{" "}
                              (penalty) ={" "}
                              {formatCurrency(penalties.driverRefundAmount)}
                            </div>
                          )}
                        {!ride.driver &&
                          penalties.timeThreshold > 0 &&
                          userType !== "passenger" && (
                            <div className="text-xs text-gray-600 mt-1">
                              Calculation: {formatCurrency(ride.commitmentFee)}{" "}
                              (commitment) ×{" "}
                              {100 -
                                Math.round(
                                  (penalties.platformFeePercentage || 0.1) * 100
                                )}
                              % ={" "}
                              {formatCurrency(
                                ride.commitmentFee *
                                  (1 - (penalties.platformFeePercentage || 0.1))
                              )}
                            </div>
                          )}
                        {!ride.driver && userType === "passenger" && (
                          <div className="text-xs text-gray-600 mt-1">
                            Full refund: {formatCurrency(ride.commitmentFee)}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {penalties.timeThreshold > 0 && (
                <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm">
                  <h4 className="font-medium mb-2">Penalty Distribution:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>
                      <strong>
                        {(penalties.platformFeePercentage || 0.1) * 100}%
                      </strong>{" "}
                      of penalty amount goes to platform as service fee
                    </li>
                    {ride.driver && ride.status === "ACCEPTED" && (
                      <li>
                        <strong>
                          {(penalties.convenienceFeePercentage || 0.9) * 100}%
                        </strong>{" "}
                        of penalty amount goes to{" "}
                        {userType === "passenger" ? "driver" : "passenger"} as
                        compensation
                      </li>
                    )}
                    {(!ride.driver || ride.status !== "ACCEPTED") && (
                      <li>
                        <strong>
                          {(penalties.convenienceFeePercentage || 0.9) * 100}%
                        </strong>{" "}
                        of penalty amount would go to affected party as
                        compensation (if a driver had accepted)
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <div className="mt-4 text-sm text-gray-600">
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
                  <li>Platform takes 10% of any penalty amount</li>
                  <li>90% of penalty goes to affected party as compensation</li>
                </ul>
              </div>
            </div>
          )}

          {/* Cancellation Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Cancellation{" "}
              <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 h-24 focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Please provide a reason for cancellation (optional)..."
            />
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end space-x-4 pt-4 mt-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={loading}
          >
            Keep Booking
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white ${
              loading
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Cancelling..." : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}
