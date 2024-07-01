package com.chatworks.chatserver.controller.model;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Date;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
public class Message {
    private String senderName;
    private String receiverName;
    private String message;
    private LocalDateTime timestamp; // Changed from String date
    private Status status;
    private String imageUrl; // New field for image support
    private boolean read; // New field for read receipts
}
