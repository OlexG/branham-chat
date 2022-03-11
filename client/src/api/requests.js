import axios from "axios";

const sendGetMessagesRequest = (room) => {
	return axios.get(`${window.location.origin}/rooms/${room}/messages`);
};

const sendPostMessageRequest = (room, msg) => {
	return axios.post(`${window.location.origin}/rooms/${room}/messages`, { content: msg });
};

const api = {
	sendGetMessagesRequest,
	sendPostMessageRequest,
};
export default api;
