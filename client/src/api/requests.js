import axios from "axios";
import cookies from 'js-cookie';
const proxy = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';
const sendGetMessagesRequest = (room) => {
	return axios.get(`${proxy}/rooms/${room}/messages`);
};

const sendPostMessageRequest = (room, msg) => {
	return axios.post(`${proxy}/rooms/${room}/messages`, { content: msg });
};

const sendLoginRequest = (token) => {
  return axios.post(`${proxy}/login`, { token, email, name, picture });
}


// intercept all requests and add the token to the header
axios.interceptors.request.use((config) => {
  const token = cookies.get('token');
  const email = cookies.get('email');
  if (config?.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.email = email;
  }

  return config;
});

const api = {
	sendGetMessagesRequest,
	sendPostMessageRequest,
  sendLoginRequest
};
export default api;
