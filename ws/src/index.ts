import { WebSocketServer, WebSocket } from "ws";

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ port: 8080 });


interface User {
    socket: WebSocket;
    room: string;
    username: string;
}

let allSockets: User[] = [];

wss.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("message", (message) => {
        try {
            const parsedMessage = JSON.parse(message.toString());
            console.log("Received message:", parsedMessage);

            if (parsedMessage.type === "join") {
                console.log("User joined room " + parsedMessage.payload.roomId + " as " + parsedMessage.payload.username);
                
                // Remove any existing connection for the same socket (in case of reconnection)
                allSockets = allSockets.filter(user => user.socket !== socket);
                
                // Add the new user
                allSockets.push({
                    socket,
                    username: parsedMessage.payload.username,
                    room: parsedMessage.payload.roomId
                });

                console.log("Total connected users:", allSockets.length);
            }

            if (parsedMessage.type === "chat") {
                console.log("User wants to chat");
                
                // Find the current user's room and username
                const currentUser = allSockets.find(user => user.socket === socket);
                
                if (!currentUser) {
                    console.log("User not found in allSockets");
                    return;
                }

                console.log("Broadcasting message from", currentUser.username, "in room", currentUser.room);

                // Send the message to all users in the same room
                const usersInRoom = allSockets.filter(user => user.room === currentUser.room);
                console.log("Users in room:", usersInRoom.length);

                usersInRoom.forEach(user => {
                    if (user.socket.readyState === WebSocket.OPEN) {
                        // Send the message in the format your frontend expects
                        const messageToSend = {
                            type: "chat",
                            payload: {
                                message: parsedMessage.payload.message,
                                username: currentUser.username // Use the sender's username
                            }
                        };
                        
                        user.socket.send(JSON.stringify(messageToSend));
                    }
                });
            }
        } catch (error) {
            console.error("Error parsing message:", error);
        }
    });

    socket.on("close", () => {
        console.log("Client disconnected");
        // Remove the disconnected user from allSockets
        const userIndex = allSockets.findIndex(user => user.socket === socket);
        if (userIndex !== -1) {
            console.log("Removing user:", allSockets[userIndex].username);
            allSockets.splice(userIndex, 1);
        }
        console.log("Total connected users:", allSockets.length);
    });

    socket.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});

console.log("WebSocket server started on port 8080");