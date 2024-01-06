import React, { useEffect, useState } from "react";
import {over} from 'stompjs'
import SockJS from "sockjs-client";

var stompClient = null;
const ChatRoom = () =>{
    const [userData, setUserData] = useState({
        userName: "",
        recepientName: "",
        connectionStatus: false,
        message: ""
    })
    
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
                status: "MESSAGE"
            };
            console.log(messageToServer);
            stompClient.send("/app/message",{},JSON.stringify(messageToServer));
            setUserData({...userData, "message": ""});
        }
    }

    const sendPrivateMessage = () => {
        if(stompClient){
            let messageToServer = {
                senderName: userData.userName,
                receiverName: tab, 
                message: userData.message,
                status: "MESSAGE"
            };

            if(userData.userName !== tab){
                privateChats.get(tab).push(messageToServer);
                setPrivateChats(new Map(privateChats))
            }

            stompClient.send("/app/private-message",{},JSON.stringify(messageToServer));
            setUserData({...userData, "message": ""});
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
                                {chat.senderName !== userData.userName && <div className="avatar">{chat.senderName}</div>}
                                <div className="message-data">{chat.message}</div>
                                {chat.senderName === userData.userName && <div className="avatar self">{chat.senderName}</div>}
                            </li>
                        ))}
                    </ul>

                    <div className="send-message">
                        <input type="text" className="input-meesage" placeholder="Send broadcast message" value={userData.message}
                            onChange={setMessage}/>
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
                            </li>
                        ))}
                    </ul>

                    <div className="send-message">
                        <input type="text" className="input-meesage" placeholder={`Send message to ${tab}`} value={userData.message}
                            onChange={setMessage}/>
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
        </div>
    )
}

export default ChatRoom;