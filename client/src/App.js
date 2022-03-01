import socket from 'socket.io-client';
import {
  useEffect,
  useState,
} from 'react';

function App() {
  const [socketInstance, setSocketInstance] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    const io = socket('http://localhost:3001', {
      withCredentials: true,
    });
    setSocketInstance(io);
    io.on('chat message', ({msg, room}) => {
      setChatMessages((prevChatMessages) => [...prevChatMessages, {msg, room}]);
    });
  }, []);


  function sendChatMessage(e) {
    e.preventDefault();
    var data = new FormData(e.target)
    if (socketInstance) {
      socketInstance.emit('chat message', {
        msg: data.get('textbox'),
        room: 'general',
      });
    }
  }

  return (
    <div className="App">
      {
        chatMessages.map((chatMessage, index) => (
          <h1 key={index}>
            {chatMessage.msg}
          </h1>
        ))
      }
      <form onSubmit={sendChatMessage}>
        <input type="text" name="textbox" />
        <button type="submit">Send chat message</button>
      </form>
    </div>
  );
}

export default App;
