package com.herride.backend.service.impl;

import com.herride.backend.config.TermiiConfig;
import com.herride.backend.model.dto.request.SmsRequest;
import com.herride.backend.model.dto.response.SmsResponse;
import com.herride.backend.service.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmsServiceImpl implements SmsService {

    private final TermiiConfig termiiConfig;
    private final WebClient.Builder webClientBuilder;

    @Override
    public void sendSms(String phoneNumber, String message) {
        SmsRequest request = SmsRequest.builder()
                .to(phoneNumber)
                .from(termiiConfig.getSenderId())
                .sms(message)
                .apiKey(termiiConfig.getApiKey())
                .build();
        try {
            sendSmsHttpRequest(request);
        } catch (Exception e) {
            log.error("SMS sending failed for phone {}: {}", phoneNumber, e.getMessage());
        }
    }

    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "smsService", fallbackMethod = "sendSmsFallback")
    @io.github.resilience4j.retry.annotation.Retry(name = "smsService")
    public void sendSmsHttpRequest(SmsRequest request) {
        SmsResponse response = webClientBuilder.build()
                .post()
                .uri(termiiConfig.getBaseUrl() + "/api/sms/send")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(SmsResponse.class)
                .block();

        if (response != null) {
            log.info("SMS sent to {}: messageId={}", request.getTo(), response.getMessageId());
        }
    }

    public void sendSmsFallback(SmsRequest request, Throwable t) {
        log.error("Termii SMS gateway unavailable (circuit breaker open). Falling back to mock logger. Error: {}", t.getMessage());
        log.info("[MOCK SMS] To: {}, Content: {}", request.getTo(), request.getSms());
    }

    @Override
    public void notifyTripAccepted(String riderPhone, String riderName,
                                   String driverName, String plateNumber) {
        String message = String.format(
                "Hi %s, your driver %s is on the way! Vehicle plate: %s. " +
                        "Track your ride on the app.",
                riderName, driverName, plateNumber);
        sendSms(riderPhone, message);
    }

    @Override
    public void notifyDriverTripAccepted(String driverPhone, String riderName,
                                         String pickupAddress) {
        String message = String.format(
                "New trip accepted! Rider: %s. Pickup: %s. " +
                        "Head to the pickup location now.",
                riderName, pickupAddress);
        sendSms(driverPhone, message);
    }

    @Override
    public void notifyDriverArrived(String riderPhone, String driverName,
                                    String plateNumber) {
        String message = String.format(
                "Your driver %s has arrived at your pickup location. " +
                        "Vehicle plate: %s.",
                driverName, plateNumber);
        sendSms(riderPhone, message);
    }

    @Override
    public void notifyTripStarted(String riderPhone, String destinationAddress) {
        String message = String.format(
                "Your trip has started. Destination: %s. " +
                        "Sit back and enjoy the ride!",
                destinationAddress);
        sendSms(riderPhone, message);
    }

    @Override
    public void notifyTripCompleted(String riderPhone, String riderName,
                                    Double fare, Double distanceKm) {
        String message = String.format(
                "Hi %s, your trip is complete! Distance: %.1f km. " +
                        "Total fare: INR %.0f. Thank you for riding with us!",
                riderName, distanceKm, fare);
        sendSms(riderPhone, message);
    }

    @Override
    public void notifyDriverTripCompleted(String driverPhone, String driverName,
                                          Double earnings) {
        String message = String.format(
                "Hi %s, trip completed! Your earnings: INR %.0f. " +
                        "Keep up the great work!",
                driverName, earnings);
        sendSms(driverPhone, message);
    }

    @Override
    public void notifyTripCancelled(String phone, String name, String reason) {
        String message = String.format(
                "Hi %s, your trip has been cancelled. Reason: %s. " +
                        "We apologize for the inconvenience.",
                name, reason);
        sendSms(phone, message);
    }
}
