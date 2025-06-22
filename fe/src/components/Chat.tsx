import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface ChatProps {
    wsRef: React.MutableRefObject<WebSocket | null>;
}

interface Message {
    id: string;
    text: string;
    username: string;
    timestamp: Date;
    isSent: boolean;
}

export const Chat = ({ wsRef }: ChatProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState<string>("");
    const [currentUsername, setCurrentUsername] = useState<string>("");
    const [currentRoomId, setCurrentRoomId] = useState<string>("");
    const [isDarkMode, setIsDarkMode] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize user data from navigation state
    useEffect(() => {
        if (location.state) {
            const { username, roomId } = location.state as { username: string; roomId: string };
            setCurrentUsername(username);
            setCurrentRoomId(roomId);
        } else {
            // Redirect to home if no state is provided
            navigate('/');
        }
    }, [location.state, navigate]);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Set up WebSocket message listener
    useEffect(() => {
        if (wsRef.current) {
            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "chat") {
                        const newMessage: Message = {
                            id: Date.now().toString(),
                            text: data.payload.message,
                            username: data.payload.username,
                            timestamp: new Date(),
                            isSent: data.payload.username === currentUsername
                        };
                        setMessages(prev => [...prev, newMessage]);
                    }
                } catch {
                    // Handle plain text messages (from your current backend)
                    const messageText = event.data;
                    const parts = messageText.split(" from ");
                    if (parts.length === 2) {
                        const newMessage: Message = {
                            id: Date.now().toString(),
                            text: parts[0],
                            username: parts[1],
                            timestamp: new Date(),
                            isSent: parts[1] === currentUsername
                        };
                        setMessages(prev => [...prev, newMessage]);
                    }
                }
            };
        }
    }, [wsRef, currentUsername]);

    const handleSendMessage = () => {
        if (inputMessage.trim() && wsRef.current) {
            const messageToSend = {
                type: "chat",
                payload: {
                    message: inputMessage.trim(),
                    username: currentUsername
                }
            };

            if (wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify(messageToSend));
                setInputMessage("");
                inputRef.current?.focus();
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const handleLeaveRoom = () => {
        navigate('/');
    };

    // Generate a consistent color for each username
    const getUsernameColor = (username: string) => {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
            '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
        ];
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={`min-h-screen font-mono transition-colors ${
            isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
        }`}>
            {/* Header */}
            <div className={`border-b p-4 flex justify-between items-center ${
                isDarkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-gray-100'
            }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                        isDarkMode ? 'bg-green-400' : 'bg-green-600'
                    }`}></div>
                    <div>
                        <h1 className="text-lg font-bold">Room: {currentRoomId}</h1>
                        <p className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            Connected as {currentUsername}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleLeaveRoom}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            isDarkMode 
                                ? 'bg-red-600 hover:bg-red-500 text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                    >
                        Leave Room
                    </button>
                    <button
                        onClick={toggleTheme}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            isDarkMode 
                                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                : 'bg-gray-200 hover:bg-gray-300 text-black'
                        }`}
                    >
                        {isDarkMode ? '☀ Light' : '🌙 Dark'}
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex flex-col h-[calc(100vh-140px)]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className={`text-center py-8 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex w-full ${
                                    message.isSent ? 'justify-end' : 'justify-start'
                                } mb-4`}
                            >
                                <div className={`max-w-[70%] ${
                                    message.isSent ? 'text-right' : 'text-left'
                                }`}>
                                    {/* Username - always shown */}
                                    <p 
                                        className={`text-xs font-semibold mb-2 px-3 ${
                                            message.isSent ? 'text-right' : 'text-left'
                                        }`}
                                        style={{ 
                                            color: message.isSent 
                                                ? (isDarkMode ? '#60A5FA' : '#3B82F6') 
                                                : getUsernameColor(message.username)
                                        }}
                                    >
                                        {message.username}
                                    </p>
                                    
                                    {/* Message bubble */}
                                    <div className={`inline-block px-4 py-3 rounded-2xl max-w-full break-words shadow-lg ${
                                        message.isSent
                                            ? isDarkMode
                                                ? 'bg-blue-600 text-white rounded-br-md'
                                                : 'bg-blue-500 text-white rounded-br-md'
                                            : isDarkMode
                                                ? 'bg-gray-700 text-white rounded-bl-md border-l-4'
                                                : 'bg-gray-200 text-black rounded-bl-md border-l-4'
                                    }`}
                                    style={{
                                        borderLeftColor: !message.isSent ? getUsernameColor(message.username) : undefined
                                    }}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                                    </div>
                                    
                                    {/* Timestamp */}
                                    <p className={`text-xs mt-1 px-3 ${
                                        message.isSent
                                            ? isDarkMode ? 'text-gray-400 text-right' : 'text-gray-500 text-right'
                                            : isDarkMode ? 'text-gray-500 text-left' : 'text-gray-400 text-left'
                                    }`}>
                                        {formatTime(message.timestamp)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className={`border-t p-4 ${
                    isDarkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-gray-100'
                }`}>
                    <div className="flex gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className={`flex-1 bg-transparent border py-3 px-4 rounded-full focus:outline-none transition-colors ${
                                isDarkMode 
                                    ? 'border-gray-600 text-white placeholder-gray-500 focus:border-gray-400'
                                    : 'border-gray-300 text-black placeholder-gray-400 focus:border-gray-600'
                            }`}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim()}
                            className={`py-3 px-6 rounded-full font-medium transition-all duration-200 ${
                                isDarkMode
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-600 disabled:text-gray-400'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500'
                            } disabled:cursor-not-allowed ${
                                inputMessage.trim() ? 'transform hover:scale-105' : ''
                            }`}
                        >
                            Send
                        </button>
                    </div>
                    <p className={`text-xs mt-2 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                        Press Enter to send • Shift+Enter for new line
                    </p>
                </div>
            </div>
        </div>
    );
};