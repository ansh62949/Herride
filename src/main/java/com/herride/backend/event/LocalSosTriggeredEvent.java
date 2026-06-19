package com.herride.backend.event;

import com.herride.backend.model.dto.response.SosAlertResponse;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class LocalSosTriggeredEvent {
    private final SosAlertResponse alert;
}
