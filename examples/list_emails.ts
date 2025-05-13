import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const USER_ID = process.env.TEST_USER_ID || 'test_user';

async function listEmails() {
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

    // List emails
    const emailsResponse = await axios.post(`${API_BASE_URL}/functions/gmail_list_messages`, {
      userId: USER_ID,
      maxResults: 10,
      query: 'is:unread',
    });

    console.log('Recent unread emails:');
    console.log(JSON.stringify(emailsResponse.data.messages, null, 2));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data || error.message);
    } else {
      console.error('Error:', error);
    }
  }
}

// Run the example
listEmails(); 