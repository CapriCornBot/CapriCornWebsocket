const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer,{
    cors: {
        origin: "*",
    }
});
// authentificated sockets
const authed = {};
const write_perm = {};

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {   
        console.log('user disconnected');
    });
    socket.on("auth", (data) => {
        console.log(data);
        if(authed[socket.id]){
            return
        }
        try {
            if (data.token) {
                if(data.token === "public") {
                    authed[socket.id] = {
                        token: data.token,
                        name: data.name
                    };
                    socket.join("public");
                } else {
                    // TODO: check token
                }
            }
        } catch (error) {
            console.log(error);
        }
    });
    socket.on("export_json", (data) => {
        console.log(data);
        if(authed[socket.id]){
            setTimeout(() => {
                socket.emit("change_json", {
                    message: "Test1"
                });
            }, 1200);
            setTimeout(() => {
                socket.emit("change_json", {
                    message: "Test2"
                });
            }, 1500);
        }
    });
});
//get port 
const port = process.env.PORT || 3001;
httpServer.listen(port);