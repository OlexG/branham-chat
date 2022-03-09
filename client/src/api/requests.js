import axios from "axios";
import { HTTP_URL } from "../constants";

const sendGetMessagesRequest = (room) => {
	return axios.get(`${HTTP_URL}/rooms/${room}/messages`);
};

const sendPostMessageRequest = (room, msg) => {
	return axios.post(`${HTTP_URL}/rooms/${room}/messages`, { content: msg });
};

const api = {
	sendGetMessagesRequest,
	sendPostMessageRequest,
};
export default api;
