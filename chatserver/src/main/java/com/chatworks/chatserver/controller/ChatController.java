package com.chatworks.chatserver.controller;

import com.chatworks.chatserver.controller.model.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller // Marks this class as a Spring MVC controller
public class ChatController {

    @Autowired // Injects SimpMessagingTemplate to send messages
    private SimpMessagingTemplate simpMessagingTemplate;

    @MessageMapping("/message") // Maps incoming messages to "/message"
    @SendTo("/chatroom/public") // Broadcasts messages to "/chatroom/public"
    public Message receiveMessage(@Payload Message message) {
        return message; // Returns the received message to be broadcast
    }

    @MessageMapping("/private-message") // Maps incoming messages to "/private-message"
    public Message recMessage(@Payload Message message) {
        simpMessagingTemplate.convertAndSendToUser(
                message.getReceiverName(), // Sends to the specific user
                "/private", // Private destination
                message // Message to send
        );
        System.out.println(message.toString()); // Logs the message
        return message; // Returns the message
    }
}
