import React, { useState, useRef } from "react";
import { FaPaperclip } from 'react-icons/fa'
import { over } from 'stompjs'
import SockJS from "sockjs-client";

var stompClient = null;

const ChatRoom = () =>{
    const MAX_FILE_SIZE = 150 * 150;
    const [userData, setUserData] = useState({
        userName: "",
        recepientName: "",
        connectionStatus: false,
        message: "",
        image: "",
    })
    const fileInputRef = useRef();

    const [publicChats, setPublicChats] = useState([])
    const [privateChats, setPrivateChats] = useState(new Map());
    const [tab, setTab] = useState("CHATROOM");

    const setUserName = (event) => {
        const {value}= event.target;
        setUserData({...userData, "userName":value});
    }

    const register = () => {
        let Sock = new SockJS('http://localhost:8080/websocket');
        stompClient = over(Sock);
        stompClient.connect({}, onConnected, onError);
    }

    const onConnected = () => {
        setUserData({...userData, "connectionStatus":true});
        stompClient.subscribe('/chatroom/public', onPublicMessageRecieved);
        stompClient.subscribe('/user/'+userData.userName+'/private', onPrivateMessageRecieved);
        onJoin();
    }

    const onPublicMessageRecieved = (payload) => {
        let payloadData = JSON.parse(payload.body);
        console.log(payload.status);
        switch(payloadData.status){
            case "JOIN":
                if(!privateChats.get(payloadData.senderName)){
                    privateChats.set(payloadData.senderName, []);
                    setPrivateChats(new Map(privateChats));
                }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break;
            case "LEAVE":
                break;
        }
    }

    const onPrivateMessageRecieved = (payload) => {
        let payloadData = JSON.parse(payload.body);

        if(privateChats.get(payloadData.senderName)){
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));
        }else{
            let list = [];
            list.push(payloadData);
            privateChats.set(payloadData.senderName, list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const onError=(error)=>{
        console.log(error);
    }

    const setMessage = (event) => {
        const {value}= event.target;
        setUserData({...userData, "message":value});
    }

    const sendPublicMessage = () => {
        if(stompClient){
            let messageToServer = {
                senderName: userData.userName,
                message: userData.message,
                status: "MESSAGE",
                image: userData.image,
            };
            console.log(messageToServer);
            stompClient.send("/app/message",{},JSON.stringify(messageToServer));
            setUserData({...userData, "message": "", "image":""});
        }
    }

    const sendPrivateMessage = () => {
        if(stompClient){
            let messageToServer = {
                senderName: userData.userName,
                receiverName: tab, 
                message: userData.message,
                image: userData.image,
                status: "MESSAGE"
            };

            if(userData.userName !== tab){
                privateChats.get(tab).push(messageToServer);
                setPrivateChats(new Map(privateChats))
            }

            stompClient.send("/app/private-message",{},JSON.stringify(messageToServer));
            setUserData({...userData, "message": "", "image":""});
        }
    }
    
    const onJoin = () => {
        if(stompClient){
            let messageToServer = {
                senderName: userData.userName,
                status: "JOIN"
            };
            stompClient.send("/app/message",{},JSON.stringify(messageToServer));
        }
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {

            if (file.size > MAX_FILE_SIZE) {
                alert("File size should not exceed 0.22 MB.");
                return; // Exit the function if file is too large
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;

                // Send this string through STOMP
                console.log(base64String);
                setUserData({...userData, "image":base64String});
            };
            reader.readAsDataURL(file);
        }
    }

    const handleClick = () => {
        fileInputRef.current.click();
    };

    return(
        <div className="container">
            {userData.connectionStatus ?
            <div className="chat-box">
                <div className="memeber-list">
                    <ul>
                        <li onClick={()=>{setTab("CHATROOM")}} className={`member ${tab==="CHATROOM" && "active"}`}>Chatroom</li>
                        {[...privateChats.keys()].filter(user => user != userData.userName).map((name, index)=>(
                            <li onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>
                {tab==="CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">
                        {publicChats.map((chat, index)=>(
                            <li className={`message ${chat.senderName === userData.userName && "self"}`} key={index}>
                                <div className="message-data">{chat.message}</div>
                                {chat.image !== "" && <div style={{alignSelf: chat.senderName === userData.userName ? 'flex-end' : 'flex-start'}}><img className="imageMessage" src={chat.image}/></div>}
                            </li>
                        ))}
                    </ul>

                    <div className="send-message">
                        <input type="text" className="input-message" placeholder="Send broadcast message" value={userData.message}
                            onChange={setMessage}/>
                        <button className="attach-button" onClick={() => handleClick()}><FaPaperclip color="grey"/></button>
                        <button type="button" className="send-button" onClick={sendPublicMessage}>Send</button>
                    </div>
                </div>}
                {tab!=="CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">
                        {[...privateChats.get(tab)].map((chat, index)=>(
                            <li className={`message ${chat.senderName === userData.userName && "self"}`} key={index}>
                                {chat.senderName !== userData.userName && <div className="avatar">{chat.senderName}</div>}
                                <div className="message-data">{chat.message}</div>
                                {chat.senderName === userData.userName && <div className="avatar self">{chat.senderName}</div>}
                                {chat.image !== "" && <div className="imageMessage"><img src={chat.image}/></div>}
                            </li>
                        ))}
                    </ul>

                    <div className="send-message">
                        <input type="text" className="input-message" placeholder={`Send message to ${tab}`} value={userData.message}
                            onChange={setMessage}/>
                        <button className="attach-button" onClick={() => handleClick()}><FaPaperclip color="grey"/></button>
                        <button type="button" className="send-button" onClick={sendPrivateMessage}>Send</button>
                    </div>
                </div>}
             </div>
            :
            <div className="register">
                <input
                id="user-name"
                placeholder="Enter your username"
                value={userData.userName}
                onChange={setUserName}
                />

                <button type='button' onClick={register}>
                    Connect
                </button>
            </div>
            }
            <div>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".png, .jpg, .jpeg"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    )
}

export default ChatRoom;