"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import api from "@/utils/api";

export default function AcceptRideModal({ ride, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      await api.put(`/api/rides/${ride._id}/accept`);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept ride");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const bookingType =
    ride.bookingType === "POINT_TO_POINT"
      ? `${ride.distance}km ride`
      : `${ride.hours}-hour booking`;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Accept {bookingType}</h2>

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
          </div>
        </div>

        {/* Commitment Fee Disclaimer */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Important Information</h3>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 space-y-2">
            <p className="text-yellow-800">
              By accepting this ride, you agree to the following:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
              <li>
                A commitment fee of {formatCurrency(ride.commitmentFee)} will be
                deducted from your wallet
              </li>
              <li>
                The commitment fee will be refunded after completing the ride
              </li>
              <li>
                If you cancel the ride, you may lose part or all of your
                commitment fee based on the cancellation policy
              </li>
            </ul>
          </div>

          {/* Cancellation Rules */}
          <div className="mt-4 text-sm text-gray-600">
            <strong>Cancellation Rules:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>
                Our dynamic cancellation policy uses an exponential algorithm
                for all cancellations
              </li>
              <li>
                Refund = e^(-2) × (Scheduled Time - Booking Time) / (Current
                Time - Booking Time)
              </li>
              <li>The closer to the scheduled time, the lower the refund</li>
              <li>The longer you wait to cancel, the lower the refund</li>
              <li>Full penalty applies at ride time (0 minutes until ride)</li>
              <li>Platform takes 10% of any penalty amount</li>
              <li>90% of penalty goes to affected party as compensation</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white ${
              loading
                ? "bg-primary-light cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark"
            }`}
          >
            {loading ? "Accepting..." : "Accept & Pay Commitment Fee"}
          </button>
        </div>
      </div>
    </div>
  );
}
