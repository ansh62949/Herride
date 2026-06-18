package com.herride.backend.service.impl;

import com.herride.backend.exception.AppException;
import com.herride.backend.model.dto.request.PaystackInitRequest;
import com.herride.backend.model.dto.response.PaymentResponse;
import com.herride.backend.model.dto.response.PaystackInitResponse;
import com.herride.backend.model.dto.response.PaystackVerifyResponse;
import com.herride.backend.model.entity.Payment;
import com.herride.backend.model.entity.Trip;
import com.herride.backend.model.entity.User;
import com.herride.backend.model.dto.response.TripResponse;
import com.herride.backend.model.entity.DriverProfile;
import com.herride.backend.model.enums.PaymentStatus;
import com.herride.backend.model.enums.TripStatus;
import com.herride.backend.repository.DriverProfileRepository;
import com.herride.backend.repository.PaymentRepository;
import com.herride.backend.repository.TripRepository;
import com.herride.backend.repository.UserRepository;
import com.herride.backend.service.PaymentService;
import com.herride.backend.websocket.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final PaystackClient paystackClient;
    private final DriverProfileRepository driverProfileRepository;
    private final WebSocketNotificationService notificationService;

    @Override
    @Transactional
    public PaymentResponse initializePayment(Long tripId, String riderEmail) {
        User rider = userRepository.findByEmail(riderEmail)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new AppException("Trip not found", HttpStatus.NOT_FOUND));

        // Validate ownership
        if (!trip.getRider().getId().equals(rider.getId())) {
            throw new AppException("This trip does not belong to you", HttpStatus.FORBIDDEN);
        }

        // Only allow payment for completed trips
        if (trip.getStatus() != TripStatus.COMPLETED) {
            throw new AppException("Payment can only be made for completed trips",
                    HttpStatus.BAD_REQUEST);
        }

        // Prevent duplicate payment
        if (paymentRepository.existsByTripIdAndStatus(tripId, PaymentStatus.PAID)) {
            throw new AppException("Trip has already been paid for", HttpStatus.CONFLICT);
        }

        // Check if pending payment already exists â€” reuse it
        Payment payment = paymentRepository.findByTripId(tripId)
                .orElse(null);

        if (payment != null && payment.getStatus() == PaymentStatus.PENDING) {
            log.info("Reusing existing payment reference {} for trip {}",
                    payment.getReference(), tripId);
            return toResponse(payment);
        }

        // Generate unique reference
        String reference = "RH-" + tripId + "-" + UUID.randomUUID().toString().substring(0, 8)
                .toUpperCase();

        // Amount in paise
        long amountInPaise = (long) (trip.getActualFare() * 100);

        PaystackInitRequest initRequest = PaystackInitRequest.builder()
                .email(rider.getEmail())
                .amount(amountInPaise)
                .reference(reference)
                .currency("INR")
                .build();

        PaystackInitResponse paystackResponse = paystackClient.initializeTransaction(initRequest);

        if (paystackResponse == null || !Boolean.TRUE.equals(paystackResponse.getStatus())) {
            throw new AppException("Failed to initialize payment with Paystack",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }

        payment = Payment.builder()
                .trip(trip)
                .rider(rider)
                .reference(reference)
                .amount(trip.getActualFare())
                .currency("INR")
                .status(PaymentStatus.PENDING)
                .paystackAccessCode(paystackResponse.getData().getAccessCode())
                .authorizationUrl(paystackResponse.getData().getAuthorizationUrl())
                .build();

        paymentRepository.save(payment);

        // Save reference on trip
        trip.setPaystackReference(reference);
        tripRepository.save(trip);

        log.info("Payment initialized for trip {}: reference={}", tripId, reference);
        return toResponse(payment);
    }

    @Override
    @Transactional
    public PaymentResponse verifyPayment(String reference) {
        Payment payment = paymentRepository.findByReference(reference)
                .orElseThrow(() -> new AppException("Payment not found", HttpStatus.NOT_FOUND));

        if (payment.getStatus() == PaymentStatus.PAID) {
            return toResponse(payment);
        }

        PaystackVerifyResponse verifyResponse = paystackClient.verifyTransaction(reference);

        if (verifyResponse == null || verifyResponse.getData() == null) {
            throw new AppException("Could not verify payment with Paystack",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }

        String paystackStatus = verifyResponse.getData().getStatus();

        if ("success".equals(paystackStatus)) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setChannel(verifyResponse.getData().getChannel());
            payment.setPaidAt(verifyResponse.getData().getPaidAt());
            payment.setGatewayResponse(verifyResponse.getData().getGatewayResponse());

            // Update trip payment status
            Trip trip = payment.getTrip();
            trip.setPaymentStatus(PaymentStatus.PAID);
            tripRepository.save(trip);

            log.info("Payment verified for reference {}: PAID", reference);

            // Notify Rider and Driver via WebSockets
            try {
                TripResponse tripRes = toTripResponse(trip);
                notificationService.notifyRiderTripStatus(trip.getRider().getId(), tripRes);
                if (trip.getDriver() != null) {
                    notificationService.notifyDriverTripStatus(trip.getDriver().getId(), tripRes);
                }
            } catch (Exception e) {
                log.error("Failed to send payment success notification: {}", e.getMessage());
            }
        } else if ("failed".equals(paystackStatus)) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setGatewayResponse(verifyResponse.getData().getGatewayResponse());
            log.warn("Payment failed for reference {}", reference);
        }

        paymentRepository.save(payment);
        return toResponse(payment);
    }

    @Override
    public PaymentResponse getPaymentByTrip(Long tripId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        Payment payment = paymentRepository.findByTripId(tripId)
                .orElseThrow(() -> new AppException("Payment not found for this trip",
                        HttpStatus.NOT_FOUND));

        boolean isRider = payment.getRider().getId().equals(user.getId());
        boolean isDriver = payment.getTrip().getDriver() != null &&
                payment.getTrip().getDriver().getId().equals(user.getId());

        if (!isRider && !isDriver) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }

        return toResponse(payment);
    }

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .tripId(payment.getTrip().getId())
                .riderId(payment.getRider().getId())
                .reference(payment.getReference())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .authorizationUrl(payment.getAuthorizationUrl())
                .channel(payment.getChannel())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }

    private TripResponse toTripResponse(Trip trip) {
        DriverProfile driverProfile = trip.getDriver() != null
                ? driverProfileRepository.findByUserId(trip.getDriver().getId()).orElse(null)
                : null;

        return TripResponse.builder()
                .id(trip.getId())
                .riderId(trip.getRider().getId())
                .riderName(trip.getRider().getFirstName() + " " + trip.getRider().getLastName())
                .riderPhone(trip.getRider().getPhone())
                .driverId(trip.getDriver() != null ? trip.getDriver().getId() : null)
                .driverName(trip.getDriver() != null
                        ? trip.getDriver().getFirstName() + " " + trip.getDriver().getLastName()
                        : null)
                .driverPhone(trip.getDriver() != null ? trip.getDriver().getPhone() : null)
                .driverEarnings(trip.getDriverEarnings())
                .plateNumber(driverProfile != null ? driverProfile.getPlateNumber() : null)
                .pickupLatitude(trip.getPickupLatitude())
                .pickupLongitude(trip.getPickupLongitude())
                .pickupAddress(trip.getPickupAddress())
                .destinationLatitude(trip.getDestinationLatitude())
                .destinationLongitude(trip.getDestinationLongitude())
                .destinationAddress(trip.getDestinationAddress())
                .status(trip.getStatus())
                .cancellationReason(trip.getCancellationReason())
                .cancellationNote(trip.getCancellationNote())
                .vehicleType(trip.getVehicleType())
                .estimatedFare(trip.getEstimatedFare())
                .actualFare(trip.getActualFare())
                .distanceKm(trip.getDistanceKm())
                .surgeApplied(trip.getSurgeApplied())
                .surgeMultiplier(trip.getSurgeMultiplier())
                .paymentStatus(trip.getPaymentStatus())
                .riderRating(trip.getRiderRating())
                .driverRating(trip.getDriverRating())
                .rideType(trip.getRideType())
                .scheduledPickupTime(trip.getScheduledPickupTime())
                .createdAt(trip.getCreatedAt())
                .acceptedAt(trip.getAcceptedAt())
                .completedAt(trip.getCompletedAt())
                .cancelledAt(trip.getCancelledAt())
                .build();
    }
}
