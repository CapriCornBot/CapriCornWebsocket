const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer,{
    cors: {
        origin: "*",
    }
});
// authentificated sockets
const authed = new Map();
const socket_by_id = new Map();
const is_bot = new Map();
const bots = new Array();
require("dotenv").config()

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {   
        console.log('user disconnected');
        if(authed.has(socket.id)){
            authed.delete(socket.id);
        }
        if(is_bot.has(socket.id)){
            is_bot.delete(socket.id);
        }
        if(socket_by_id.has(socket.id)){
            socket_by_id.delete(socket.id);
        }
        const idx = bots.indexOf(socket.id);
        if(idx > -1){
            bots.splice(idx,1);
        }

    });
    socket.on("auth", (data) => {
        console.log(data);
        if(authed.get(socket.id)){
            return
        }
        try {
            if (data.token) {
                if(data.token === "public") {
                    authed.set(socket.id, data);
                    socket_by_id.set(socket.id, socket);
                    socket.join("public");
                } else if (data.token == process.env.BOT_TOKEN) {
                    console.log("New Bot Authentificated")
                    authed.set(socket.id, data.token);
                    socket_by_id.set(socket.id, socket);
                    is_bot.set(socket.id, true);
                    bots.push(socket.id);
                    socket.join("public");
                    socket.join("bot");
                }
            }
        } catch (error) {
            console.log(error);
        }
    });
    socket.on("export_json", (data) => {
        console.log(data);
        if(!data){
            return
        }
        if(authed.has(socket.id)){
            if (!data.data) {
                data.data = {};
            }
            call_bots("cog_embed_builder_get_json", {
                code: 1,
                data: {
                    to_socket_id: socket.id,
                    channel_id: data.data.channel_id,
                    message_id: data.data.message_id
                }
            })
        }
    });

    socket.on("cog_embed_builder_get_json_callback", (data) => {
        console.log(data);
        if (!authed.has(socket.id)) { 
            return
        }
        if (!is_bot.has(socket.id)) {
            return
        }
        if (!socket.data) {
            socket.data = {};
        }
        socket_to_callback = socket_by_id.get(data.data.to_socket_id);
        if(socket_to_callback){
            socket_to_callback.emit("export_json_callback", data);
            // CODE 1 = EXPORT JSON
            if (data.code == 1) {
                socket.emit("cog_embed_builder_get_json_callback", {
                    code: 1,
                    data: data.data
                });
            }
        }
    });
});

function call_bots(name, data) {
    bots.forEach(bot_id => {
        try {
            socket_by_id.get(bot_id).emit(name, data);
        }catch(error){
            console.log(error);
        }
    });
}
//get port 
const port = process.env.PORT || 3001;
httpServer.listen(port);