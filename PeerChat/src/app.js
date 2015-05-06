/**
 * Created by laice on 5/4/15.
 */

// nwjs
window.PeerChat = window.PeerChat || {};

//node
//PeerChat = PeerChat || {};



var PeerChat = window.PeerChat;
PeerChat.init = function(username){

    this.auto_request_peerlist = true;
    this.logs = [];
    this.new_logs = [];
    this.errors = [];
    this.new_errors = [];
    this.messages = [];
    this.private_peers = [];
    this.public_peers = [];
    this.pending_public_peers = [];
    this.pending_private_peers = [];
    this.peer = new Peer({key: "<peerjs api key>"});

    this.peer.on('open', function(id){
        console.log('connection open, i am ' + id);
        PeerChat.id = id;
        $('#peerid').empty().text(id);
        PeerChat.name = (username || "Nameless")+"@"+PeerChat.id.substring(0, 5);
        PeerChat.make_peerlist();
    });

    this.peer.on('connection', function(conn){
        console.log('connection from peer received, sending name request');

        conn.on('data', function(data){
            PeerChat.handle_data_conn(conn, data);
        });

        conn.on('close', function(){
            PeerChat.remove_peer_by_id(conn.peer);
        });

    });

    return this.peer;
};

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
            PeerChat.remove_pending_peer(peer, null, true);
            PeerChat.make_peerlist();
            peer.conn.send({type: "peer_confirmed", share: true});
            break;
        case "private_hello":
            console.log('private hello received');
            peer.name = data.data;
            PeerChat.private_peers.push(peer);
            PeerChat.remove_pending_peer(peer, null, false);
            PeerChat.make_peerlist();
            peer.conn.send({type: "peer_confirmed", share: false});
            break;
        case "msg":
            console.log('msg received');
            PeerChat.msg.display(data);
            break;
        case "pmsg":
            PeerChat.log('Private message received');
            PeerChat.msg.display(data);
            break;
        case "name_request":
            console.log('name request received', data);
            peer.conn.send({type: "name_response", data: PeerChat.name, share: peer.share});
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
        case "remove_peer":
            PeerChat.remove_peer_by_id(peer.conn.peer);
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
        case "pmsg":
            PeerChat.log('Private message received');
            PeerChat.msg.display(data);
            break;
        case "peer_confirmed":
            PeerChat.log('peer confirmed, removing from peerlist');
            PeerChat.remove_pending_peer(null, conn, data.share);
            break;
        case "remove_peer":
            PeerChat.remove_peer_by_id(conn.peer);
            break;
    }

};
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
                PeerChat.remove_peer_by_id(peer.conn.peer);
            });
        });
};

PeerChat.remove_peer_by_id = function(id){
    console.log('connection closed with ' + id);
    for(var i = PeerChat.public_peers.length-1; i >= 0; i--){
        if(PeerChat.public_peers[i].id === id){
            PeerChat.public_peers.splice(i, 1);
        }
    }
    for(var i = PeerChat.private_peers.length-1; i >= 0; i--){
        if(PeerChat.private_peers[i].id === id){
            PeerChat.private_peers.splice(i, 1);
        }
    }
    this.make_peerlist();
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
    $('#pending-peers').append("<option>" + data.data);
    switch(data.share){
        case true:
            this.pending_public_peers.push({ conn: conn, name: data.data, id: conn.peer, share: data.share});
            break;
        case false:
            this.pending_private_peers.push({conn: conn, name: data.data, id: conn.peer, share: data.share});
            break;
        default:
            PeerChat.error('Invalid peer share setting')
            break;
    }

    this.make_peerlist();
};

PeerChat.remove_pending_peer = function(peer, conn, share) {
    var id;
    if(peer){
        id = peer.id;
    } else if (conn) {
        id = conn.peer;
    }
    PeerChat.log('removing id ' + id + ' share?: ' + share);
    switch(share){
        case true:
            for (var i = this.pending_public_peers.length - 1; i >= 0; i--) {
                if (id === this.pending_public_peers[i].id) {
                    PeerChat.log('matching pending peer id found ' + this.pending_public_peers[i].id);
                    this.pending_public_peers.splice(i, 1);
                }
            }
            break;
        case false:
            for (var i = this.pending_private_peers.length - 1; i >= 0; i--) {
                if (id === this.pending_private_peers[i].id) {
                    PeerChat.log('matching pending peer id found ' + this.pending_private_peers[i].id);
                    this.pending_private_peers.splice(i, 1);
                }
            }
            break;
        default:
            PeerChat.error('Invalid share trying to remove pending peer ' + id);
            break;


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
    for(var i = 0, len = this.pending_public_peers.length; i < len; i++){
        if(this.pending_public_peers[i].name === name){
            peer = this.pending_public_peers[i]
        }
    }
    if(peer) {
        peer.share = true;
        PeerChat.log('sending public hello with ids ' + this.public_peer_ids());
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
    for(var i = 0, len = this.pending_private_peers.length; i < len; i++){
        if(this.pending_private_peers[i].name === name){
            peer = this.pending_private_peers[i];
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

PeerChat.find = function(name, share){
    switch(share){
        case true:
            for(var i = 0, len = this.public_peers.length; i < len; i++){
                if(this.public_peers[i].name === name){
                    return this.public_peers[i];
                }
            }
            break;
        case false:
            for(var i = 0, len = this.private_peers.length; i < len; i++){
                if(this.private_peers[i].name === name){
                    return this.private_peers[i];
                }
            }
            break;
        default:
            PeerChat.error('Invalid share in PeerChat.find');
    }
};

PeerChat.make_peerlist = function(){
    PeerChat.log('making peerlist');
    $('#peerlist-public').empty();
    $('#peerlist-public').append("<option id='self'>"+PeerChat.name+"</option>");
    for(var i = 0, len = this.public_peers.length; i < len; i++){
        $('#peerlist-public').append("<option id='public-peer'>"+this.public_peers[i].name + "</option>");
    }
    $('#peerlist-private').empty();
    for(var i = 0, len = this.private_peers.length; i < len; i++){
        $('#peerlist-private').append("<option id='private-peer'>" + this.private_peers[i].name + "</option>");
    }
    $('#pending-public-peers').empty();
    for(var i = 0, len = this.pending_public_peers.length; i < len; i++){
        $('#pending-public-peers').append("<option id='pending-public-peer'>" + this.pending_public_peers[i].name + "</option>");
    }
    $('#pending-private-peers').empty();
    for(var i = 0, len = this.pending_private_peers.length; i < len; i++){
        $('#pending-private-peers').append("<option id='pending-private-peer'>" + this.pending_private_peers[i].name + "</option>");
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
    var ta = document.getElementById('console_output');
    ta.scrollTop = ta.scrollHeight;
};



PeerChat.msg = function(msg){
    PeerChat.msg.broadcastPublic(msg, true);
    PeerChat.msg.broadcastPrivate(msg, true);
    PeerChat.msg.display({data: msg, from: PeerChat.name});
};

PeerChat.msg.private = function(msg, targets) {
    console.log(targets);
    for(var i = 0; i < targets.length; i++) {
        if(targets[i]) {
            console.log(targets[i]);
            targets[i].conn.send({
                type: "pmsg",
                data: msg,
                from: PeerChat.name + " whispers"
            });
        }
    }
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
    var ta = document.getElementById('chat-output-text');
    ta.scrollTop = ta.scrollHeight;
};
