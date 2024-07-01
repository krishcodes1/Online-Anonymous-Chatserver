import React, { useEffect, useState } from 'react';
import { over } from 'stompjs';
import SockJS from 'sockjs-client';
import Registration from './Registration';
import ChatWindow from './ChatWindow';
import moment from 'moment'; // Import moment.js for timestamp conversion

var stompClient =null;
const ChatRoom = () => {
    const [privateChats, setPrivateChats] = useState(new Map());     
    const [publicChats, setPublicChats] = useState([]); 
    const [tab,setTab] =useState("CHATROOM");
    const [userData, setUserData] = useState({
        username: '',
        receivername: '',
        connected: false,
        message: '',
        imageUrl: '', // New field for image support
        read: false, // New field for read receipts
        timestamp: new Date() // New field for timestamps
      });
    useEffect(() => {
      console.log(userData);
    }, [userData]);

    const connect =()=>{
        let Sock = new SockJS('http://localhost:8080/ws');
        stompClient = over(Sock);
        stompClient.connect({},onConnected, onError);
    }

    const onConnected = () => {
        setUserData({...userData,"connected": true});
        stompClient.subscribe('/chatroom/public', onMessageReceived);
        stompClient.subscribe('/user/'+userData.username+'/private', onPrivateMessage);
        stompClient.subscribe('/user/'+userData.username+'/activeUsers', onActiveUsersReceived); // New subscription
        userJoin();
    }

    const onActiveUsersReceived = (payload) => {
        var activeUsers = JSON.parse(payload.body);
        activeUsers.forEach(user => {
            if(!privateChats.get(user)){
                privateChats.set(user,[]);
                setPrivateChats(new Map(privateChats));
            }
        });
    }

    const userJoin=()=>{
          var chatMessage = {
            senderName: userData.username,
            status:"JOIN"
          };
          stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    }

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
    
        fetch('http://localhost:8080/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update the state with the image URL
            setUserData({ ...userData, imageUrl: data.url });
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
    }
    

    const onMessageReceived = (payload) => {
        var payloadData = JSON.parse(payload.body);
        switch(payloadData.status){
            case "JOIN":
                if(!privateChats.get(payloadData.senderName)){
                    privateChats.set(payloadData.senderName,[]);
                    setPrivateChats(new Map(privateChats));
                }
                break;
            case "MESSAGE":
                // Convert the timestamp to the user's local time
                payloadData.timestamp = moment(payloadData.timestamp).format('LLL');
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break;
        }
    }
    
    const onPrivateMessage = (payload)=>{
        console.log(payload);
        var payloadData = JSON.parse(payload.body);
        if(privateChats.get(payloadData.senderName)){
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));
        }else{
            let list =[];
            list.push(payloadData);
            privateChats.set(payloadData.senderName,list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const onError = (err) => {
        console.log(err);
        
    }

    const handleMessage =(event)=>{
        const {value}=event.target;
        setUserData({...userData,"message": value});
    }
    const sendValue=()=>{
        if (stompClient) {
            var chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status:"MESSAGE",
                imageUrl: userData.imageUrl, // Include the imageUrl in the message
                read: userData.read, // Include the read status in the message
                timestamp: new Date() // Set the timestamp to the current time
            };
            console.log(chatMessage);
            stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
            setUserData({...userData,"message": "", "imageUrl": "", "read": false});
        }
    }

    {userData.imageUrl && userData.imageUrl.startsWith('http') && (
        <div>
            {/* Display a thumbnail */}
            <img src={userData.imageUrl} alt="Uploaded Image" width="100" height="100" />
    
            {/* Or display a clickable link */}
            <a href={userData.imageUrl} target="_blank" rel="noopener noreferrer">
                View Image
            </a>
        </div>
    )}
    
    const sendPrivateValue=()=>{
        if (stompClient) {
            var chatMessage = {
                senderName: userData.username,
                receiverName:tab,
                message: userData.message,
                status:"MESSAGE",
                imageUrl: userData.imageUrl, // Include the imageUrl in the message
                read: userData.read, // Include the read status in the message
                timestamp: new Date().toISOString() // Set the timestamp to the current time

            };
            
            if(userData.username !== tab){
                privateChats.get(tab).push(chatMessage);
                setPrivateChats(new Map(privateChats));
            }
            stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
            setUserData({...userData,"message": "", "imageUrl": "", "read": false});
        }
    }
    
    const handleUsername=(event)=>{
        const {value}=event.target;
        setUserData({...userData,"username": value});
    }

    const registerUser=()=>{
        connect();
    }
    return (
        <div className="container">
            <div className="title">Welcome to Private Chat</div>
            {userData.connected?
            <div className="chat-box">
                <div className="member-list">
                    <ul>
                        <li onClick={()=>{setTab("CHATROOM")}} className={`member ${tab==="CHATROOM" && "active"}`}>Chatroom</li>
                        {[...privateChats.keys()].map((name,index)=>(
                            <li onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>{name}</li>
                        ))}
                    </ul>
                </div>
                {tab==="CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">
                    {publicChats.map((chat,index)=>(
    <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
        {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
        <div className="message-data">{chat.message}</div>
        {chat.imageUrl && <img src={chat.imageUrl} alt=""/>} {/* Display the image if imageUrl is present */}
        <div className="timestamp">{new Date(chat.timestamp).toLocaleString()}</div> {/* Display the timestamp */}

        {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
    </li>
))}

                    </ul>
    
                    <div className="send-message">
                        <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} /> 
                        <input type="file" onChange={handleImageUpload} /> {/* New input for image upload */}
                        <button type="button" className="send-button" onClick={sendValue}>send</button>
                    </div>
                </div>}
                {tab!=="CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">
                        {[...privateChats.get(tab)].map((chat,index)=>(
                            <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                <div className="message-data">{chat.message}</div>
                                {chat.imageUrl && <img src={chat.imageUrl} alt="Uploaded Image"/>} {/* Display the image if imageUrl is present */}
                                {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                            </li>
                        ))}
                    </ul>
    
                    <div className="send-message">
                        <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} /> 
                        <input type="file" onChange={handleImageUpload} /> {/* New input for image upload */}
                        <button type="button" className="send-button" onClick={sendPrivateValue}>send</button>
                    </div>
                </div>}
            </div>
            
            :
    
            
            
            <div className="register">
                <input
                    id="user-name"
                    placeholder="Enter your name"
                    name="userName"
                    value={userData.username}
                    onChange={handleUsername}
                    margin="normal"
                  />
                <button type="button" onClick={registerUser} style={{ fontFamily: "'San Francisco', sans-serif", backgroundColor: '#161618', color: '#ffffff', border: '1px solid #818181', borderRadius: '15px', padding: '10px 20px' }}>
                  {/* Add this line */}
                Connect
            </button>
    
            </div>}
        </div>
        )
    }
    
    export default ChatRoom
