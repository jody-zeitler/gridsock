Gridsock
A canvas whiteboard with magnets
Written by Jody Zeitler

This is your basic HTML canvas whiteboard with support for object-like magnets, images that you can manipulate around the board to serve as markers. It uses socket.io to communicate with a node.js server where the board is persisted. Users can manipulate the board anonymously or log into the chat for a realtime collaboration experience.

The node.js server component is in server/ and the web client is in client/