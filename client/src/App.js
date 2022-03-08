import "./App.css";
import { useState, useEffect } from "react";

function App() {
	const [messages, setMessages] = useState([]);
  const [formValue, setFormValue] = useState("");
	useEffect(() => {
		function addMessage(message) {
			setMessages((messages) => [...messages, message]);
		}
		// listen for chat messages using websockets
    const ws = new WebSocket("/rooms/general/messages.ws");
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "new_message") {
        addMessage(message);
      }
    }
	}, []);

  function sendMessage(e){
    console.log(e);
    e.preventDefault();
    if (formValue) {
      console.log(formValue);
    }
  }

  function handleFormValueChange(e){
    setFormValue(e.target.value);
  }
	return (
		<>
			<header>
				<select id="room-choice"></select>
				<h1 id="title">Branham Chat</h1>
			</header>
			<ul id="messages" className="messages-box">
				{messages.map(({ msg, metadata }) => (
					<li>
						<span className="msg-time">{metadata.timestamp}</span>
						<span className="msg-msg">{msg}</span>
					</li>
				))}
			</ul>
			<footer>
				<form method="dialog" id="send-message" onSubmit={sendMessage}>
					<input type="text" id="message-content" name="Message" className="enter-field" required value={formValue} onChange={handleFormValueChange} />
					<input className="submit-button" type="submit" value="Send" id="message-send-button" />
				</form>
			</footer>
		</>
	);
}

export default App;
