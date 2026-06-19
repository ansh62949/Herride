package com.herride.backend.event;

import com.herride.backend.model.dto.response.TripResponse;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class LocalTripCancelledEvent {
    private final TripResponse trip;
}
