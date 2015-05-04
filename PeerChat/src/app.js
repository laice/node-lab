/**
 * Created by laice on 5/4/15.
 */



window.PeerChat = window.PeerChat || {};
PeerChat.init = function(username){
    this.name = username || "Nameless";
    this.logs = [];
    this.new_logs = [];
    this.errors = [];
    this.new_errors = [];
    this.messages = [];
    this.private_peers = [];
    this.public_peers = [];
    this.peer = new Peer({key: "tfqi5mkneo9cz0k9"});

    this.peer.on('open', function(id){
        console.log('connection open, i am ' + id);
        this.id = id;
        $('#peerid').empty().text(id);
    });

    return this.peer;
};
PeerChat.join = function(id, sharelist){

        var peer = {
            conn: this.peer.connect(id),
            name: ""
        };
        if(sharelist) {
            this.public_peers.push(peer);
        } else {
            this.private_peers.push(peer);
        }
        peer.conn.on('open', function(){
            PeerChat.log('Connection open to peer');
        });

        peer.conn.on('data', function(data){
            PeerChat.log('Data received from peer');
            switch(data.type){
                case "public_hello":
                    peer.name = data.thisname;
                    for(var i = 0, len = data.data.length; i < len; i++){
                        var matches = 0;
                        for(var j = 0, len2 = PeerChat.public_peers.length; j < len2; j++) {
                            if (PeerChat.public_peers[j].conn.peer === data.data[i]) {
                                matches++;
                            }
                        }
                        if(matches === 0){
                            PeerChat.log('Adding Peer ' + data.data[i]);
                            PeerChat.join(data.data[i], true);
                        } else {
                            PeerChat.log(data.data[i] + ' already a peer, skipping..')
                        }
                    }
                    break;
                case "private_hello":
                    peer.name = data.thisname;
                    break;
                case "msg":
                    PeerChat.msg.display(data);
                    break;
            }
        });


};
PeerChat.log = function(text, type){
    if(!ifp.legit(type)){
        this.new_logs.push(text);
    } else if(ifp.legit(type)) {
        switch(type){
            case 'log':
                this.new_logs.unshift(text + "\n");
                break;
            case 'error':
                this.new_errors.unshift(text + "\n");
                break;
            default:
                console.log('invalid log type', type);
                break;
        }
    }
};

PeerChat.error = function(text) {
    PeerChat.log(text, 'error');
};

PeerChat.log.update = function(divs) {
    if(ifp.legit(divs.errors)){
        var errs = PeerChat.new_errors;
        for(var i = errs.length-1; i >= 0; i--) {
            $(divs.errors).append(errs[i]);
            PeerChat.errors.push(errs[i]);
            errs.splice(i, 1)

        }

    }

    if(ifp.legit(divs.logs)){
        var logs = PeerChat.new_logs;
        for(var i = logs.length-1; i >=0; i--){
            $(divs.logs).append(logs[i]);
            PeerChat.logs.push(logs[i]);
            logs.splice(i, 1);
        }
    }
};



PeerChat.msg = function(msg){
    PeerChat.msg.broadcastPublic(msg);
    PeerChat.msg.broadcastPrivate(msg);
};

PeerChat.msg.private = function(msg, target) {
    target.send({
        type: "pmsg",
        data: msg,
        from: PeerChat.name
    });
};

PeerChat.msg.broadcastPublic = function(msg) {
    for(var i = 0, len = this.public_peers.length; i < len; i++){
        this.public_peers[i].conn.send({
            type: "msg",
            data: msg,
            from: PeerChat.name
        });
    }
};

PeerChat.msg.broadcastPrivate = function(msg){
    for(var i = 0, len = this.private_peers.length; i < len; i++){
        this.private_peers[i].conn.send({
            type: "msg",
            data: msg,
            from: PeerChat.name
        });
    }
};

PeerChat.msg.display = function(msg_data){
    PeerChat.messages.push(msg_data);
    $('#chat-output-text').append(msg_data.from + ": " + msg_data.data);
};

