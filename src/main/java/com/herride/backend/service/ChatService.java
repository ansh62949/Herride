package com.herride.backend.service;

import com.herride.backend.websocket.event.ChatMessageEvent;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatService {

    private final ConcurrentHashMap<Long, List<ChatMessageEvent>> chatHistories = new ConcurrentHashMap<>();

    public void addMessage(Long tripId, ChatMessageEvent message) {
        chatHistories.computeIfAbsent(tripId, k -> new ArrayList<>()).add(message);
    }

    public List<ChatMessageEvent> getChatHistory(Long tripId) {
        return chatHistories.getOrDefault(tripId, new ArrayList<>());
    }

    public void clearChatHistory(Long tripId) {
        chatHistories.remove(tripId);
    }
}

