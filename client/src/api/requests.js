import axios from "axios";
const proxy = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';
const sendGetMessagesRequest = (room) => {
	return axios.get(`${proxy}/rooms/${room}/messages`);
};

const sendPostMessageRequest = (room, msg) => {
	return axios.post(`${proxy}/rooms/${room}/messages`, { content: msg });
};

const api = {
	sendGetMessagesRequest,
	sendPostMessageRequest,
};
export default api;
