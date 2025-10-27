package org.uniproject.SaviaU.service.health;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.uniproject.SaviaU.config.SupabaseClients;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthService {

    private final SupabaseClients clients;

    public Mono<Boolean> healthCheck() {
        return clients.getDbAnon().get()
                .uri("/")
                .retrieve()
                .toBodilessEntity()
                .map(resp -> resp.getStatusCode() == HttpStatus.OK)
                .doOnNext(ok -> log.info("Supabase health check: {}", ok ? "OK" : "FAILED"))
                .onErrorReturn(false);
    }
}

