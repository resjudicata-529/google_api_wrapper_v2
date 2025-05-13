import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const USER_ID = process.env.TEST_USER_ID || 'test_user';

async function createEvent() {
  try {
    // First, check if we need to authenticate
    const response = await axios.get(`${API_BASE_URL}/auth/initiate`, {
      params: {
        userId: USER_ID,
        redirectUrl: `${API_BASE_URL}/auth-success.html`,
      },
    });

    if (response.data.authUrl) {
      console.log('Please authenticate first by visiting:');
      console.log(response.data.authUrl);
      return;
    }

    // Create a new event for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0);

    const eventResponse = await axios.post(`${API_BASE_URL}/functions/calendar_create_event`, {
      userId: USER_ID,
      summary: 'Test Event from API',
      description: 'This is a test event created via the Google API wrapper',
      startDateTime: tomorrow.toISOString(),
      endDateTime: endTime.toISOString(),
      attendees: ['test@example.com'],
      location: 'Virtual Meeting',
    });

    console.log('Created event:');
    console.log(JSON.stringify(eventResponse.data.event, null, 2));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data || error.message);
    } else {
      console.error('Error:', error);
    }
  }
}

// Run the example
createEvent(); 