import { NextRequest, NextResponse } from 'next/server';
import { useRideStore } from '@/app/store/rideStore';

export async function POST(req: NextRequest) {
  try {
    const rideData = await req.json();
    
    // Get the store instance
    const store = useRideStore.getState();
    
    // Add the ride request to the store
    store.addRideRequest({
      id: Math.random().toString(36).substring(7),
      ...rideData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing ride request:', error);
    return NextResponse.json(
      { error: 'Failed to process ride request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get the store instance
    const store = useRideStore.getState();
    
    return NextResponse.json({ 
      requests: store.pendingRequests 
    });
  } catch (error) {
    console.error('Error fetching ride requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ride requests' },
      { status: 500 }
    );
  }
}
