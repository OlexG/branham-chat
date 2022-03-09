import axios from "axios";

const sendGetMessagesRequest = (room) => {
	return axios.get(`/rooms/${room}/messages`);
};

const sendPostMessageRequest = (room, msg) => {
	return axios.post(`/rooms/${room}/messages`, { content: msg });
};

const api = {
	sendGetMessagesRequest,
	sendPostMessageRequest,
};
export default api;
