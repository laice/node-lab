/**
 * Created by laice on 5/4/15.
 */

// nwjs
window.PeerChat = window.PeerChat || {};

//node
//PeerChat = PeerChat || {};



var PeerChat = window.PeerChat;
PeerChat.init = function(username){
    this.name = username || "Nameless";
    this.auto_request_peerlist = true;
    this.logs = [];
    this.new_logs = [];
    this.errors = [];
    this.new_errors = [];
    this.messages = [];
    this.private_peers = [];
    this.public_peers = [];
    this.pending_peers = [];
    this.peer = new Peer({key: "tfqi5mkneo9cz0k9"});

    this.peer.on('open', function(id){
        console.log('connection open, i am ' + id);
        PeerChat.id = id;
        $('#peerid').empty().text(id);
    });

    this.peer.on('connection', function(conn){
        console.log('connection from peer received, sending name request');

        conn.on('data', function(data){
            PeerChat.handle_data_conn(conn, data);
        })
    });

    PeerChat.make_peerlist();

    return this.peer;
};

// "server" actions use conn "client" actions use peer
PeerChat.handle_data_peer = function(peer, data){
    switch(data.type){
        case "public_hello":
            console.log('public hello received');
            peer.name = data.name;
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
            PeerChat.public_peers.push(peer);
            PeerChat.remove_pending_peer(peer);
            PeerChat.make_peerlist();
            peer.conn.send({type: "peer_confirmed"});
            break;
        case "private_hello":
            console.log('private hello received');
            peer.name = data.data;
            PeerChat.private_peers.push(peer);
            PeerChat.remove_pending_peer(peer);
            PeerChat.make_peerlist();
            peer.conn.send({type: "peer_confirmed"});
            break;
        case "msg":
            console.log('msg received');
            PeerChat.msg.display(data);
            break;
        case "name_request":
            console.log('name request received', data);
            peer.conn.send({type: "name_response", data: PeerChat.name});
            break;

        case "request_peerlist":
            console.log('peerlist request received');
            if(PeerChat.is_public(peer.conn.peer)){
                peer.conn.send({
                    name: PeerChat.name,
                    type: "public_hello",
                    data: PeerChat.public_peers
                });
            }
            break;


    }
};

PeerChat.handle_data_conn = function(conn, data){
    switch(data.type){
        case "initiate":
            PeerChat.log('initiating connection, sending name request');
            conn.send({
                type: 'name_request'
            });
            break;
        case "name_response":
            PeerChat.log('name response received, adding pending peer for approval');
            PeerChat.pending_peer(conn, data);
            break;
        case "msg":
            PeerChat.log('message received');
            PeerChat.msg.display(data);
            break;
        case "peer_confirmed":
            PeerChat.log('peer confirmed, removing from peerlist');
            PeerChat.remove_pending_peer(null, conn);
            break;
    }

}
PeerChat.join = function(id, sharelist){

        var peer = {
            conn: this.peer.connect(id),
            name: "",
            id: id,
            share: sharelist
        };

        peer.conn.on('open', function(){
            PeerChat.log('Connection open to peer');
            peer.conn.send({type:"initiate"});
            peer.conn.on('data', function(data){
                PeerChat.log('Data received from peer');
                PeerChat.handle_data_peer(peer, data);
            });

            peer.conn.on('close', function(){
                console.log('connection closed with ' + peer.conn.peer);
                for(var i = this.public_peers.length-1; i >= 0; i++){
                    if(this.public_peers[i].id === peer.conn.peer){
                        this.public_peers[i].splice(i, 1);
                    }
                }
                for(var i = this.private_peers.length-1; i >= 0; i++){
                    if(this.private_peers[i].id === peer.conn.peer){
                        this.private_peers[i].splice(i, 1);
                    }
                }
                this.make_peerlist();
            });
        });
};

PeerChat.is_public = function(id){
    for(var i = 0, len = this.public_peers; i < len; i++){
        if(this.public_peers[i].id === id){
            return true;
        }
    }
    return false;
};

PeerChat.pending_peer = function(conn, data){
    console.log('adding pending peer');
    $('#pending_peers').append("<option>" + data.data);
    this.pending_peers.push({ conn: conn, name: data.data, id: conn.peer});
    this.make_peerlist();
};

PeerChat.remove_pending_peer = function(peer, conn) {
    var id;
    if(peer){
        id = peer.id;
    } else if (conn) {
        id = conn.peer;
    }
    PeerChat.log('removing id ' + id);
    for(var i = this.pending_peers.length-1; i >= 0; i--){
        if(id === this.pending_peers[i].id){
            PeerChat.log('matching pending peer id found ' + this.pending_peers[i].id);
            this.pending_peers.splice(i, 1);
        }
    }

    PeerChat.make_peerlist();
};

PeerChat.public_peer_ids = function(){
    var ppids = [];
    for(var i = 0, len = this.public_peers.length; i < len; i++){
        ppids.push(this.public_peers[i].conn.peer);
    }
    return ppids;
};

PeerChat.public_hello = function(name){
    var peer;
    for(var i = 0, len = this.pending_peers.length; i < len; i++){
        if(this.pending_peers[i].name === name){
            peer = this.pending_peers[i]
        }
    }
    if(peer) {
        peer.share = true;
        peer.conn.send({
            type: "public_hello",
            name: PeerChat.name,
            data: this.public_peer_ids()
        });

        if(this.auto_request_peerlist){
            peer.conn.send({
                type:"request_peerlist"
            });
        }

        this.public_peers.push(peer);
    } else {
        PeerChat.log.error('No pending peer for public peer response');
    }

    this.make_peerlist();
};

PeerChat.private_hello = function(name){
    var peer;
    for(var i = 0, len = this.pending_peers.length; i < len; i++){
        if(this.pending_peers[i].name === name){
            peer = this.pending_peers[i];
        }
    }
    if(peer){
        peer.share = false;
        peer.conn.send({
            type: "private_hello",
            data: PeerChat.name
        });
        this.private_peers.push(peer);
    } else {
        PeerChat.error('No pending private peer connection found');
    }

    this.make_peerlist();

};

PeerChat.make_peerlist = function(){
    $('#peerlist').empty();
    $('#peerlist_public').append("<option id='self'>"+PeerChat.name);
    for(var i = 0, len = this.public_peers.length; i < len; i++){
        $('#peerlist').append("<option id='public_peer'>"+this.public_peers[i].name);
    }
    for(var i = 0, len = this.private_peers.length; i < len; i++){
        $('#peerlist_private').append("<option id='private_peer'>" + this.private_peers[i].name);
    }
    $('#pending_peers').empty();
    for(var i = 0, len = this.pending_peers.length; i < len; i++){
        $('#pending_peers').append("<option id='pending_peer'>" + this.pending_peers[i].name);
    }
};

PeerChat.log = function(text, type){
    if(!ifp.legit(type)){
        this.new_logs.push(text);
    } else if(ifp.legit(type)) {
        switch(type){
            case 'log':
                this.new_logs.unshift(text + "<\n");
                break;
            case 'error':
                this.new_errors.unshift(text + "\n");
                break;
            default:
                console.log('invalid log type', type);
                break;
        }
    }
    PeerChat.log.update({
        errors: '#errors',
        logs: '#logs'
    })
};

PeerChat.error = function(text) {
    PeerChat.log(text, 'error');
};

PeerChat.log.update = function(divs) {
    if(ifp.legit(divs.errors)){
        var errs = PeerChat.new_errors;
        for(var i = errs.length-1; i >= 0; i--) {
            $('#console_output').append("ERROR: " + errs[i] + "\n");
            PeerChat.errors.push(errs[i]);
            errs.splice(i, 1)

        }

    }

    if(ifp.legit(divs.logs)){
        var logs = PeerChat.new_logs;
        for(var i = logs.length-1; i >=0; i--){
            $('#console_output').append(logs[i] + "\n");
            PeerChat.logs.push(logs[i]);
            logs.splice(i, 1);
        }
    }
};



PeerChat.msg = function(msg){
    PeerChat.msg.broadcastPublic(msg, true);
    PeerChat.msg.broadcastPrivate(msg, true);
    PeerChat.msg.display({data: msg, from: PeerChat.name});
};

PeerChat.msg.private = function(msg, target) {
    target.send({
        type: "pmsg",
        data: msg,
        from: PeerChat.name
    });
    PeerChat.msg.display({data: msg, from: PeerChat.name});
};

PeerChat.msg.broadcastPublic = function(msg, no_self_msg) {
    for(var i = 0, len = PeerChat.public_peers.length; i < len; i++){
        PeerChat.public_peers[i].conn.send({
            type: "msg",
            data: msg,
            from: PeerChat.name
        });
    }
    if(!ifp.legit(no_self_msg)){
        PeerChat.msg.display({data: msg, from: PeerChat.name});
    }

};

PeerChat.msg.broadcastPrivate = function(msg, no_self_msg){
    for(var i = 0, len = PeerChat.private_peers.length; i < len; i++){
        PeerChat.private_peers[i].conn.send({
            type: "msg",
            data: msg,
            from: PeerChat.name
        });
    }
    if(!ifp.legit(no_self_msg)){
        PeerChat.msg.display({data: msg, from: PeerChat.name});
    }

};

PeerChat.msg.display = function(msg_data){
    PeerChat.messages.push(msg_data);
    $('#chat-output-text').append(msg_data.from + ": " + msg_data.data + "\n");
};
