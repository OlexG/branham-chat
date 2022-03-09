import axios from "axios";

const sendGetMessagesRequest = (room) => {
	return axios.get(`http://${window.location.host}/rooms/${room}/messages`);
};

const sendPostMessageRequest = (room, msg) => {
	return axios.post(`http://${window.location.host}/rooms/${room}/messages`, { content: msg });
};

const api = {
	sendGetMessagesRequest,
	sendPostMessageRequest,
};
export default api;
