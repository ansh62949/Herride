package com.herride.backend.service;

import com.herride.backend.exception.AppException;
import com.herride.backend.kafka.producer.TripEventProducer;
import com.herride.backend.model.dto.request.TripRequest;
import com.herride.backend.model.dto.response.FareEstimateResponse;
import com.herride.backend.model.dto.response.TripResponse;
import com.herride.backend.model.entity.DriverProfile;
import com.herride.backend.model.entity.Trip;
import com.herride.backend.model.entity.User;
import com.herride.backend.model.enums.*;
import com.herride.backend.repository.DriverProfileRepository;
import com.herride.backend.repository.TripRepository;
import com.herride.backend.repository.UserRepository;
import com.herride.backend.service.impl.TripServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripServiceTest {

    @Mock private TripRepository tripRepository;
    @Mock private UserRepository userRepository;
    @Mock private DriverProfileRepository driverProfileRepository;
    @Mock private PricingService pricingService;
    @Mock private TripEventProducer tripEventProducer;
    @Mock private io.micrometer.core.instrument.MeterRegistry meterRegistry;
    @Mock private io.micrometer.core.instrument.Counter counter;
    @Mock private LocationService locationService;

    @InjectMocks
    private TripServiceImpl tripService;

    private User rider;
    private User driver;
    private DriverProfile driverProfile;
    private Trip trip;
    private TripRequest tripRequest;
    private FareEstimateResponse fareEstimate;

    @BeforeEach
    void setUp() {
        rider = User.builder()
                .id(1L).firstName("John").lastName("Doe")
                .email("rider@test.com").phone("+2348011111111")
                .role(Role.RIDER).gender(Gender.FEMALE).status(UserStatus.ACTIVE)
                .build();

        driver = User.builder()
                .id(2L).firstName("James").lastName("Driver")
                .email("driver@test.com").phone("+2348022222222")
                .role(Role.DRIVER).gender(Gender.FEMALE).status(UserStatus.ACTIVE)
                .build();

        driverProfile = DriverProfile.builder()
                .id(1L).user(driver)
                .vehicleType(VehicleType.SEDAN)
                .plateNumber("ABC123")
                .driverStatus(DriverStatus.ONLINE)
                .rating(4.5).totalTrips(10)
                .totalEarnings(50000.0).totalRatings(10)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build();

        tripRequest = new TripRequest();
        tripRequest.setPickupLatitude(28.6139);
        tripRequest.setPickupLongitude(77.2090);
        tripRequest.setPickupAddress("Connaught Place, New Delhi");
        tripRequest.setDestinationLatitude(28.5562);
        tripRequest.setDestinationLongitude(77.1000);
        tripRequest.setDestinationAddress("IGI Airport Terminal 3, New Delhi");
        tripRequest.setVehicleType(VehicleType.SEDAN);

        fareEstimate = FareEstimateResponse.builder()
                .estimatedFare(1500.0).distanceKm(10.0)
                .surgeApplied(false).surgeMultiplier(1.0)
                .currency("INR").vehicleType("SEDAN")
                .build();

        trip = Trip.builder()
                .id(1L).rider(rider)
                .pickupLatitude(28.6139).pickupLongitude(77.2090)
                .pickupAddress("Connaught Place, New Delhi")
                .destinationLatitude(28.5562).destinationLongitude(77.1000)
                .destinationAddress("IGI Airport Terminal 3, New Delhi")
                .vehicleType(VehicleType.SEDAN)
                .estimatedFare(1500.0).distanceKm(10.0)
                .surgeApplied(false).surgeMultiplier(1.0)
                .status(TripStatus.REQUESTED)
                .paymentStatus(PaymentStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("Should request trip successfully")
    void shouldRequestTripSuccessfully() {
        when(userRepository.findByEmail("rider@test.com")).thenReturn(Optional.of(rider));
        when(tripRepository.findActiveRiderTrip(rider.getId())).thenReturn(Optional.empty());
        when(pricingService.estimateFare(any(), any(), any(), any(), any()))
                .thenReturn(fareEstimate);
        when(tripRepository.save(any(Trip.class))).thenReturn(trip);
        when(meterRegistry.counter(anyString(), any(String[].class))).thenReturn(counter);

        TripResponse response = tripService.requestTrip("rider@test.com", tripRequest);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(TripStatus.SEARCHING_DRIVER);
        assertThat(response.getPickupAddress()).isEqualTo("Connaught Place, New Delhi");
        assertThat(response.getEstimatedFare()).isEqualTo(1500.0);
        verify(tripRepository).save(any(Trip.class));
        verify(tripEventProducer).publishTripRequested(any());
    }

    @Test
    @DisplayName("Should throw conflict when rider has active trip")
    void shouldThrowConflictWhenRiderHasActiveTrip() {
        trip.setStatus(TripStatus.IN_PROGRESS);
        when(userRepository.findByEmail("rider@test.com")).thenReturn(Optional.of(rider));
        when(tripRepository.findActiveRiderTrip(rider.getId()))
                .thenReturn(Optional.of(trip));

        assertThatThrownBy(() -> tripService.requestTrip("rider@test.com", tripRequest))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("already have an active trip")
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);

        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should accept trip successfully")
    void shouldAcceptTripSuccessfully() {
        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(driver));
        when(driverProfileRepository.findByUserId(driver.getId()))
                .thenReturn(Optional.of(driverProfile));
        when(tripRepository.countActiveTripsForDriverExcludingTrip(driver.getId(), 1L)).thenReturn(0L);
        when(tripRepository.findById(1L)).thenReturn(Optional.of(trip));
        when(tripRepository.save(any(Trip.class))).thenReturn(trip);
        when(driverProfileRepository.save(any())).thenReturn(driverProfile);

        TripResponse response = tripService.acceptTrip("driver@test.com", 1L);

        assertThat(response.getStatus()).isEqualTo(TripStatus.DRIVER_ASSIGNED);
        verify(tripEventProducer).publishTripAccepted(any());
    }

    @Test
    @DisplayName("Should throw bad request when offline driver tries to accept")
    void shouldThrowWhenOfflineDriverAcceptsTrip() {
        driverProfile.setDriverStatus(DriverStatus.OFFLINE);

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(driver));
        when(tripRepository.findById(1L)).thenReturn(Optional.of(trip));
        when(driverProfileRepository.findByUserId(driver.getId()))
                .thenReturn(Optional.of(driverProfile));

        assertThatThrownBy(() -> tripService.acceptTrip("driver@test.com", 1L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("must be online")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should throw bad request on invalid state transition")
    void shouldThrowOnInvalidStateTransition() {
        trip.setStatus(TripStatus.REQUESTED);

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(driver));
        when(tripRepository.findByIdAndDriverId(1L, driver.getId()))
                .thenReturn(Optional.of(trip));

        // Cannot go EN_ROUTE from REQUESTED â€” must be ACCEPTED first
        assertThatThrownBy(() -> tripService.updateTripStatus("driver@test.com", 1L, "EN_ROUTE"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Cannot transition")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should throw bad request on invalid action string")
    void shouldThrowOnInvalidActionString() {
        trip.setStatus(TripStatus.DRIVER_ASSIGNED);

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(driver));
        when(tripRepository.findByIdAndDriverId(1L, driver.getId()))
                .thenReturn(Optional.of(trip));

        assertThatThrownBy(() -> tripService.updateTripStatus("driver@test.com", 1L, "INVALID"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Invalid action")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should cancel trip successfully as rider")
    void shouldCancelTripSuccessfullyAsRider() {
        com.herride.backend.model.dto.request.CancelTripRequest cancelRequest =
                new com.herride.backend.model.dto.request.CancelTripRequest();
        cancelRequest.setReason(CancellationReason.RIDER_CANCELLED);
        cancelRequest.setNote("Changed my mind");

        when(userRepository.findByEmail("rider@test.com")).thenReturn(Optional.of(rider));
        when(tripRepository.findById(1L)).thenReturn(Optional.of(trip));
        when(tripRepository.save(any(Trip.class))).thenReturn(trip);

        TripResponse response = tripService.cancelTrip("rider@test.com", 1L, cancelRequest);

        assertThat(response.getStatus()).isEqualTo(TripStatus.CANCELLED);
        assertThat(response.getCancellationReason())
                .isEqualTo(CancellationReason.RIDER_CANCELLED);
        verify(tripEventProducer).publishTripCancelled(any());
    }

    @Test
    @DisplayName("Should throw forbidden when unrelated user tries to cancel trip")
    void shouldThrowForbiddenWhenUnrelatedUserCancelsTrip() {
        User stranger = User.builder()
                .id(99L).email("stranger@test.com")
                .role(Role.RIDER).build();

        com.herride.backend.model.dto.request.CancelTripRequest cancelRequest =
                new com.herride.backend.model.dto.request.CancelTripRequest();
        cancelRequest.setReason(CancellationReason.RIDER_CANCELLED);

        when(userRepository.findByEmail("stranger@test.com")).thenReturn(Optional.of(stranger));
        when(tripRepository.findById(1L)).thenReturn(Optional.of(trip));

        assertThatThrownBy(() -> tripService.cancelTrip("stranger@test.com", 1L, cancelRequest))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("not part of this trip")
                .extracting("status")
                .isEqualTo(HttpStatus.FORBIDDEN);
    }
}
