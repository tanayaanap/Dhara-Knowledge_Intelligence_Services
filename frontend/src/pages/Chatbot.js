import { useState } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const botMsg = { sender: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMsg]);

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to server" },
      ]);
    }

    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      {/* z-[60] -- explicit, and higher than DarkModeToggle's z-index (which
          is very likely what was silently winning this corner before, since
          an element with NO z-index loses to one that has any explicit
          z-index regardless of DOM order). */}
      <div
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[60] bg-green-500 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer shadow-lg"
      >
        💬
      </div>

      {/* Chat Box */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[60] w-80 h-96 bg-gray-900 rounded-xl flex flex-col shadow-xl">
          <div className="bg-green-500 p-3 text-white font-bold rounded-t-xl">
            🌱 Dhara Assistant
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto text-sm text-white space-y-2">
            {messages.map((msg, i) => (
              <div key={i}>
                <b>{msg.sender === "user" ? "You" : "Dhara"}:</b>
                <div>{msg.text}</div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex p-2 border-t border-gray-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 p-2 rounded bg-gray-800 text-white outline-none"
              placeholder="Ask about crops..."
            />
            <button
              onClick={sendMessage}
              className="ml-2 bg-green-500 px-3 rounded text-white"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;