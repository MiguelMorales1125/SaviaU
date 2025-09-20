package org.uniproject.SaviaU.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.uniproject.SaviaU.dto.LoginRequest;
import org.uniproject.SaviaU.dto.LoginResponse;
import org.uniproject.SaviaU.service.SupabaseService;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Para permitir peticiones desde el frontend
public class SupabaseController {

    private final SupabaseService supabaseService;

    /**
     * Endpoint para verificar la conectividad con Supabase
     */
    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, Object>>> healthCheck() {
        return supabaseService.healthCheck()
                .map(isHealthy -> {
                    if (isHealthy) {
                        return ResponseEntity.ok(Map.of(
                                "status", "UP",
                                "database", "Supabase",
                                "message", "Conexión exitosa"
                        ));
                    } else {
                        return ResponseEntity.status(503).body(Map.of(
                                "status", "DOWN",
                                "database", "Supabase",
                                "message", "Error de conexión"
                        ));
                    }
                });
    }

    /**
     * Endpoint para autenticación/inicio de sesión
     * POST /api/auth/login
     */
    @PostMapping("/auth/login")
    public Mono<ResponseEntity<LoginResponse>> login(@RequestBody LoginRequest loginRequest) {
        return supabaseService.login(loginRequest)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(401).build());
    }

    /**
     * Endpoint genérico para consultar cualquier tabla
     * GET /api/table/{tableName}?columns=*&filter=id.eq.1
     */
    @GetMapping("/table/{tableName}")
    public Mono<ResponseEntity<String>> selectFromTable(
            @PathVariable String tableName,
            @RequestParam(required = false, defaultValue = "*") String columns,
            @RequestParam(required = false) String filter) {
        
        return supabaseService.select(tableName, columns, filter)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).body("Error al consultar la tabla"));
    }

    /**
     * Endpoint para insertar datos en una tabla
     * POST /api/table/{tableName}
     */
    @PostMapping("/table/{tableName}")
    public Mono<ResponseEntity<String>> insertIntoTable(
            @PathVariable String tableName,
            @RequestBody Map<String, Object> data) {
        
        return supabaseService.insert(tableName, data)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).body("Error al insertar en la tabla"));
    }

    /**
     * Endpoint para actualizar datos en una tabla
     * PATCH /api/table/{tableName}?filter=id.eq.1
     */
    @PatchMapping("/table/{tableName}")
    public Mono<ResponseEntity<String>> updateTable(
            @PathVariable String tableName,
            @RequestParam String filter,
            @RequestBody Map<String, Object> data) {
        
        return supabaseService.update(tableName, data, filter)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).body("Error al actualizar la tabla"));
    }

    /**
     * Endpoint para eliminar datos de una tabla
     * DELETE /api/table/{tableName}?filter=id.eq.1
     */
    @DeleteMapping("/table/{tableName}")
    public Mono<ResponseEntity<String>> deleteFromTable(
            @PathVariable String tableName,
            @RequestParam String filter) {
        
        return supabaseService.delete(tableName, filter)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).body("Error al eliminar de la tabla"));
    }

    /**
     * Endpoint para ejecutar funciones de Supabase
     * POST /api/rpc/{functionName}
     */
    @PostMapping("/rpc/{functionName}")
    public Mono<ResponseEntity<String>> executeFunction(
            @PathVariable String functionName,
            @RequestBody(required = false) Map<String, Object> parameters) {
        
        return supabaseService.rpc(functionName, parameters)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).body("Error al ejecutar la función"));
    }

    /**
     * Endpoint de ejemplo específico para usuarios (si tienes una tabla 'usuarios')
     */
    @GetMapping("/usuarios")
    public Mono<ResponseEntity<String>> getUsuarios() {
        return supabaseService.select("usuarios", "*", null)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).body("Error al obtener usuarios"));
    }

    /**
     * Endpoint para crear un nuevo usuario
     */
    @PostMapping("/usuarios")
    public Mono<ResponseEntity<String>> createUsuario(@RequestBody Map<String, Object> usuario) {
        return supabaseService.insert("usuarios", usuario)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).body("Error al crear usuario"));
    }
}