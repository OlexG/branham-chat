import axios from "axios";

export const sendGetMessagesRequest = (room) => {
	return axios.get(`${window.location.origin}/rooms/${room}/messages`);
};

export const sendPostMessageRequest = (room, msg) => {
	return axios.post(`${window.location.origin}/rooms/${room}/messages`, {
		content: msg,
	});
};

export const sendLoginRequest = (token) => {
	return axios.post(`${window.location.origin}/login`, {
		token,
	});
};
