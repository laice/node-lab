# Node-Lab #

This is a collection of projects and experiments with nodejs, nwjs, and related js modules.

Feel free to contact me about any of these projects.

### SimpleServer ###
This is just a basic server I use for serving apps locally during development. It uses connect and static routing to keep things tight.

This is mostly included for my on convenience. If you want to use it to test projects here, it's important to note the server's working directory must be set to the index.html of the app being run. So, for example with PeerChat, you'd want to set the working directory to "path/to/node-lab/PeerChat/src", but you actually run the server as "node path/to/node-lab/SimpleServer/src/app-peerchat.js"

### PeerChat ###
This is a proof-of-concept PeerJS based chat client which embraces p2p technology. Each peer maintains private and public peerlists. When a peer joins another peer, and they both accept public transaction, peerlists are exchanged, and the public peerlist of each peer is expanded to include each other's peers, minus duplicates - if each peer on the added lists accept the public request. This creates a chain of public joining which, when accepted by all parties, allows the entire peer network to propagate back to the initial joiner. Either the initial peer will provide all other peer references, or recursively they will be added as public requests are made to each member of the initial peer list.

The private peerlist works more like a classic chat implementation where each peer is sort of a 'room' or 'channel' of their own. Private peers are not propagated to other peers, however a peer can broadcast messages to their own private peerlist.

Whispering (private messages) is also supported to peers connected on both private and public peerlists.

Those familiar with p2p will know, after the initial connection is made through the signalling server, all network traffic occurs between peers, putting the bulk network load on peers communicating rather than the server itself.

PeerJS uses WebRTC, which among other features has encryption built in - so any messages sent between peers are encrypted by default. It is still possible for an observer to trace the connection from peer-to-peer, and discover a connection has been made, but the details of the communication itself should remain secure. NOTE: Do not use this if you're using TOR (you should have scripts turned off anyway!) as it will make a direct connection to other peers and will reveal your connection.

The source for the node.js version of PeerChat is in the PeerChat folder, the source for the nwjs version is in PeerChat-NW and a standalone nwjs executable is available in the dist folder. You will need to supply your own PeerJS api keys for the source versions.
