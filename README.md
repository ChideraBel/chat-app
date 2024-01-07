# Getting Started with Chat App

Please check download or check out the server side the handles the communication: https://github.com/ChideraBel/chatserver.

## Updates
Added image sharing functionality for emojis and small pictures. Since STOMP only allows text messages, images are encoded to base64 and sent through the server. And on reception html `img` tag supports loading base64 string as the image src.

The obvious way to incorporate image sharing would be to upload the image from the client side onto some sort of cloud storage like S3 and send the link through the chat-server, then download on the other client-side. Just wanted to play with data encoding a little :)


# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.
