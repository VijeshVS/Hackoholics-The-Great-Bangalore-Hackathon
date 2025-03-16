'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '@/store/authStore';

const HOURLY_RATE = 150; // ₹150 per hour

export default function BookingForm() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    scheduledTime: '',
    duration: 1,
  });
  const [loading, setLoading] = useState(false);

  const calculateEstimatedFare = () => {
    return HOURLY_RATE * formData.duration;
  };

  const calculateCommitmentFee = () => {
    return calculateEstimatedFare() * 0.3; // 30% of estimated fare
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error('Please login first');
        return;
      }

      // Validate wallet balance
      if (user.wallet?.balance < calculateCommitmentFee()) {
        toast.error('Insufficient wallet balance for commitment fee');
        return;
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/rides`, {
        passengerId: user.id,
        scheduledTime: formData.scheduledTime,
        duration: Number(formData.duration),
        estimatedFare: calculateEstimatedFare(),
        passengerCommitment: {
          amount: calculateCommitmentFee(),
          status: 'pending'
        }
      });

      toast.success('Booking created successfully!');
      setFormData({ scheduledTime: '', duration: 1 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum datetime for scheduling (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Scheduled Time
        </label>
        <input
          type="datetime-local"
          className="input w-full"
          min={getMinDateTime()}
          value={formData.scheduledTime}
          onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Duration (hours)
        </label>
        <select
          className="input w-full"
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
          required
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(hours => (
            <option key={hours} value={hours}>{hours} hour{hours > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Hourly Rate:</span>
          <span>₹{HOURLY_RATE}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Duration:</span>
          <span>{formData.duration} hour{formData.duration > 1 ? 's' : ''}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Estimated Fare:</span>
          <span>₹{calculateEstimatedFare()}</span>
        </div>
        <div className="flex justify-between text-sm text-blue-600">
          <span>Commitment Fee (30%):</span>
          <span>₹{calculateCommitmentFee()}</span>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? 'Creating Booking...' : 'Book Auto'}
      </button>

      <p className="text-xs text-gray-500 mt-2">
        Note: A commitment fee of 30% will be deducted from your wallet when booking.
        This ensures both parties are committed to the ride.
      </p>
    </form>
  );
}
