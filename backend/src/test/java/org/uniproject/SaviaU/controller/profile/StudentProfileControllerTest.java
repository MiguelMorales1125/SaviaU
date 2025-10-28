package org.uniproject.SaviaU.controller.profile;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.uniproject.SaviaU.dto.ProfileUpdateRequest;
import org.uniproject.SaviaU.service.profile.ProfileService;
import reactor.core.publisher.Mono;

import java.util.Map;

@WebFluxTest(controllers = {StudentProfileController.class})
class StudentProfileControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private ProfileService profileService;

    @Test
    void getProfile_ok() {
        Mockito.when(profileService.getProfile("tok")).thenReturn(Mono.just(Map.of("exists", true)));

        webTestClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/profile").queryParam("accessToken", "tok").build())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.exists").isEqualTo(true);
    }

    @Test
    void patchProfile_validationError_alias() {
        // alias inválido (demasiado corto y con espacio)
        String body = "{\n" +
                "  \"accessToken\": \"tok\",\n" +
                "  \"alias\": \" x \"\n" +
                "}";

        webTestClient.patch()
                .uri("/api/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.message").isEqualTo("Validación fallida");
    }

    @Test
    void uploadPhoto_serviceError() {
        Mockito.when(profileService.uploadPhoto(Mockito.eq("tok"), Mockito.any())).thenReturn(Mono.error(new IllegalArgumentException("Tipo de archivo no permitido")));

        webTestClient.post()
                .uri(uriBuilder -> uriBuilder.path("/api/profile/photo").queryParam("accessToken", "tok").build())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.message").isEqualTo("Tipo de archivo no permitido");
    }
}

