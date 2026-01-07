import { NextResponse } from 'next/server';

let schedulerRunning = false;
let lastRewardDate = null;

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    if (action === 'start') {
      if (schedulerRunning) {
        return NextResponse.json({
          message: 'Scheduler is already running',
          status: 'running'
        });
      }
      
      // Start the scheduler
      schedulerRunning = true;
      startDailyRewardScheduler();
      
      return NextResponse.json({
        message: 'Daily reward scheduler started successfully',
        status: 'started',
        nextCheck: new Date(Date.now() + 60000).toISOString()
      });
      
    } else if (action === 'stop') {
      schedulerRunning = false;
      return NextResponse.json({
        message: 'Daily reward scheduler stopped',
        status: 'stopped'
      });
      
    } else if (action === 'status') {
      return NextResponse.json({
        status: schedulerRunning ? 'running' : 'stopped',
        lastRewardDate,
        currentTime: new Date().toISOString()
      });
      
    } else {
      return NextResponse.json(
        { message: 'Invalid action. Use: start, stop, or status' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Scheduler API error:', error);
    return NextResponse.json(
      { message: 'Scheduler error', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return NextResponse.json({
    status: schedulerRunning ? 'running' : 'stopped',
    lastRewardDate,
    currentTime: new Date().toISOString(),
    instructions: {
      start: 'POST /api/scheduler with {"action": "start"}',
      stop: 'POST /api/scheduler with {"action": "stop"}',
      status: 'GET /api/scheduler'
    }
  });
}

function startDailyRewardScheduler() {
  console.log('Daily reward scheduler started at:', new Date().toISOString());
  
  const checkInterval = setInterval(async () => {
    if (!schedulerRunning) {
      clearInterval(checkInterval);
      console.log('Daily reward scheduler stopped');
      return;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if it's 12:00 AM (00:00)
    if (currentHour === 0 && currentMinute === 0) {
      const today = now.toDateString();
      
      // Prevent running multiple times in the same day
      if (lastRewardDate !== today) {
        console.log('Running daily rewards at 12:00 AM:', now.toISOString());
        
        try {
          // Call the daily reward processing API
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/daily-rewards`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          const result = await response.json();
          
          if (result.success) {
            lastRewardDate = today;
            console.log('Daily rewards processed successfully:', result.data);
          } else {
            console.error('Daily reward processing failed:', result.message);
          }
          
        } catch (error) {
          console.error('Error calling daily reward API:', error);
        }
      }
    }
    
  }, 60000); // Check every minute
}

// Auto-start scheduler when the API is first loaded
if (typeof window === 'undefined') { // Server-side only
  // You can uncomment this to auto-start the scheduler
  // startDailyRewardScheduler();
  // schedulerRunning = true;
}
