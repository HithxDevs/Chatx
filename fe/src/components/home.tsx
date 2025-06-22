import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HomeProps {
    wsRef: React.MutableRefObject<WebSocket | null>;
}

export default function Home({ wsRef }: HomeProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const [generatedRoomId, setGeneratedRoomId] = useState('');
    const [username, setUsername] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);

    const generateRoomId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setGeneratedRoomId(result);
    };

    const handleCreateRoom = () => {
        if (username.trim()) {
            generateRoomId();
        }
    };

    const handleJoinRoom = () => {
        const roomCode = inputRef.current?.value.trim();
        if (roomCode && username.trim()) {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: "join",
                    payload: {
                        username: username.trim(),
                        roomId: roomCode.toUpperCase()
                    }
                }));
                navigate("/chat", { 
                    state: { 
                        username: username.trim(), 
                        roomId: roomCode.toUpperCase() 
                    } 
                });
            } else if (wsRef.current) {
                wsRef.current.onopen = () => {
                    wsRef.current?.send(JSON.stringify({
                        type: "join",
                        payload: {
                            username: username.trim(),
                            roomId: roomCode.toUpperCase()
                        }
                    }));
                    navigate("/chat", { 
                        state: { 
                            username: username.trim(), 
                            roomId: roomCode.toUpperCase() 
                        } 
                    });
                };
            }
        }
    };

    const handleJoinGeneratedRoom = () => {
        if (generatedRoomId && username.trim()) {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: "join",
                    payload: {
                        username: username.trim(),
                        roomId: generatedRoomId
                    }
                }));
                navigate("/chat", { 
                    state: { 
                        username: username.trim(), 
                        roomId: generatedRoomId 
                    } 
                });
            } else if (wsRef.current) {
                wsRef.current.onopen = () => {
                    wsRef.current?.send(JSON.stringify({
                        type: "join",
                        payload: {
                            username: username.trim(),
                            roomId: generatedRoomId
                        }
                    }));
                    navigate("/chat", { 
                        state: { 
                            username: username.trim(), 
                            roomId: generatedRoomId 
                        } 
                    });
                };
            }
        }
    };

    const copyRoomCode = async () => {
        try {
            await navigator.clipboard.writeText(generatedRoomId);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy room code:', err);
        }
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const isJoinDisabled = !inputRef.current?.value.trim() || !username.trim();
    const isCreateDisabled = !username.trim();

    return (
        <div className={`min-h-screen font-mono flex items-center justify-center p-4 transition-colors ${
            isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
        }`}>
           
            <div className="w-full max-w-lg">
                <div className={`border rounded-lg p-8 transition-colors ${
                    isDarkMode ? 'border-gray-600 bg-black' : 'border-gray-300 bg-white'
                }`}>
                    {/* Theme Toggle */}
                    <div className="flex justify-end mb-4">
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

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${
                                isDarkMode ? 'bg-white' : 'bg-black'
                            }`}></div>
                            <h1 className="text-xl font-bold">
                                Real Time Chat
                            </h1>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            temporary room that expires after all users exit
                        </p>
                    </div>

                    {/* Username Input */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full bg-transparent border py-3 px-4 rounded focus:outline-none transition-colors ${
                                isDarkMode 
                                    ? 'border-gray-600 text-white placeholder-gray-500 focus:border-gray-400'
                                    : 'border-gray-300 text-black placeholder-gray-400 focus:border-gray-600'
                            }`}
                        />
                    </div>

                    {/* Create Room Button */}
                    <button
                        onClick={handleCreateRoom}
                        disabled={isCreateDisabled}
                        className={`w-full py-3 px-4 rounded font-medium mb-6 transition-colors ${
                            isDarkMode 
                                ? 'bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400' 
                                : 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500'
                        } disabled:cursor-not-allowed`}
                    >
                        Create New Room
                    </button>

                    {/* Generated Room ID Display */}
                    {generatedRoomId && (
                        <div className={`mb-6 p-4 border rounded transition-colors ${
                            isDarkMode 
                                ? 'border-gray-600 bg-gray-900' 
                                : 'border-gray-300 bg-gray-100'
                        }`}>
                            <p className={`text-xs mb-2 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Room Code:
                            </p>
                            <div className="flex items-center justify-between mb-3">
                                <p className={`text-lg font-bold tracking-wider ${
                                    isDarkMode ? 'text-white' : 'text-black'
                                }`}>
                                    {generatedRoomId}
                                </p>
                                <button
                                    onClick={copyRoomCode}
                                    className={`py-2 px-4 rounded font-medium transition-colors ${
                                        copySuccess
                                            ? isDarkMode
                                                ? 'bg-green-600 text-white'
                                                : 'bg-green-500 text-white'
                                            : isDarkMode
                                                ? 'bg-gray-600 text-white hover:bg-gray-500'
                                                : 'bg-gray-300 text-black hover:bg-gray-400'
                                    }`}
                                >
                                    {copySuccess ? '✓ Copied!' : '📋 Copy'}
                                </button>
                            </div>
                            <button
                                onClick={handleJoinGeneratedRoom}
                                className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                                    isDarkMode
                                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                            >
                                Enter Room
                            </button>
                        </div>
                    )}

                    {/* Join Room Section */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter Room Code"
                            ref={inputRef}
                            className={`flex-1 bg-transparent border py-3 px-4 rounded focus:outline-none transition-colors ${
                                isDarkMode 
                                    ? 'border-gray-600 text-white placeholder-gray-500 focus:border-gray-400'
                                    : 'border-gray-300 text-black placeholder-gray-400 focus:border-gray-600'
                            }`}
                            maxLength={8}
                            onChange={() => {}} // Force re-render to update button state
                        />
                        <button
                            onClick={handleJoinRoom}
                            disabled={isJoinDisabled}
                            className={`py-3 px-6 rounded font-medium transition-colors ${
                                isDarkMode
                                    ? 'bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400'
                                    : 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500'
                            } disabled:cursor-not-allowed`}
                        >
                            Join Room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}