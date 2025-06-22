import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/home';
import { Chat } from './components/Chat';
import { useEffect, useRef } from 'react';

function App() {
    const wsRef = useRef<WebSocket | null>(null);
  
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");
        
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
  
        return () => {
            ws.close();
        };
    }, []);
  
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home wsRef={wsRef} />} />
                <Route path="/chat" element={<Chat wsRef={wsRef}/>} />
                <Route path="*" element={<Home wsRef={wsRef} />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;