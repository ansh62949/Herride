package com.herride.backend.service;

import com.herride.backend.model.dto.response.PaymentResponse;

public interface PaymentService {
    PaymentResponse initializePayment(Long tripId, String riderEmail);
    PaymentResponse verifyPayment(String reference);
    PaymentResponse getPaymentByTrip(Long tripId, String email);
}
