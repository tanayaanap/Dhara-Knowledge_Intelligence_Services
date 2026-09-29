import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

const Chatbot = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg = { sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    // Clear the input immediately -- previously this ran only after the
    // fetch resolved, so the text sat in the box (looking "stuck") for the
    // whole time the response was being generated.
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // language tells the backend which language to have Gemini reply
        // in -- see app.py's /api/chat, which reads this and adds it to
        // the prompt. Falls back to English server-side if omitted.
        body: JSON.stringify({ message: text, language: i18n.language }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: t("chatbot.errorConnecting") },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Compact markdown component overrides -- Gemini's replies come back with
  // headers, bold text, and numbered/bulleted lists (##, **, 1., -), which
  // previously rendered as literal characters in a plain <div>. These give
  // each element sensible spacing/sizing inside the narrow chat bubble
  // instead of react-markdown's default (which assumes a full-width page).
  const markdownComponents = {
    h1: ({ node, ...props }) => <h1 className="text-base font-bold mt-2 mb-1" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-sm font-bold mt-2 mb-1" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />,
    p:  ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-0.5" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-0.5" {...props} />,
    li: ({ node, ...props }) => <li className="ml-1" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-semibold text-emerald-300" {...props} />,
    hr: () => <hr className="my-2 border-gray-700" />,
    a:  ({ node, ...props }) => <a className="text-emerald-400 underline" target="_blank" rel="noreferrer" {...props} />,
  };

  return (
    <>
      {/* Floating Button */}
      <div
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[60] bg-green-500 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer shadow-lg hover:bg-green-600 transition-colors"
      >
        💬
      </div>

      {/* Chat Box */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[60] w-80 h-96 bg-gray-900 rounded-xl flex flex-col shadow-xl">
          <div className="bg-green-500 p-3 text-white font-bold rounded-t-xl flex items-center justify-between">
            <span>🌱 {t("chatbot.title")}</span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto text-sm text-white space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={msg.sender === "user" ? "text-right" : "text-left"}>
                <div className="text-xs font-semibold text-emerald-400 mb-1">
                  {msg.sender === "user" ? t("chatbot.you") : t("chatbot.bot")}
                </div>
                <div
                  className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-left ${
                    msg.sender === "user" ? "bg-emerald-700" : "bg-gray-800"
                  }`}
                >
                  {msg.sender === "bot" ? (
                    <ReactMarkdown components={markdownComponents}>{msg.text}</ReactMarkdown>
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="text-left">
                <div className="text-xs font-semibold text-emerald-400 mb-1">{t("chatbot.bot")}</div>
                <div className="inline-block bg-gray-800 rounded-xl px-3 py-2 text-gray-400 text-xs">
                  {t("chatbot.typing")}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex p-2 border-t border-gray-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 p-2 rounded bg-gray-800 text-white outline-none"
              placeholder={t("chatbot.placeholder")}
            />
            <button
              onClick={sendMessage}
              disabled={sending}
              className="ml-2 bg-green-500 px-3 rounded text-white disabled:opacity-50"
            >
              {t("chatbot.send")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;