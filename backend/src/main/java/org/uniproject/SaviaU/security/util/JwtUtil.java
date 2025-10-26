package org.uniproject.SaviaU.security.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

public class JwtUtil {

    public static String generateHs256Token(String subject,
                                            String email,
                                            String role,
                                            String issuer,
                                            long ttlSeconds,
                                            String secret) {
        try {
            // Header
            Map<String, Object> header = Map.of(
                    "alg", "HS256",
                    "typ", "JWT"
            );

            // Payload (claims)
            long now = Instant.now().getEpochSecond();
            long exp = now + ttlSeconds;
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", subject);
            payload.put("iss", issuer);
            payload.put("iat", now);
            payload.put("exp", exp);
            if (email != null) payload.put("email", email);
            if (role != null) payload.put("role", role);

            String headerJson = toJson(header);
            String payloadJson = toJson(payload);

            String headerB64 = base64UrlEncode(headerJson.getBytes(StandardCharsets.UTF_8));
            String payloadB64 = base64UrlEncode(payloadJson.getBytes(StandardCharsets.UTF_8));

            String signingInput = headerB64 + "." + payloadB64;
            String signatureB64 = hmacSha256(signingInput, secret);

            return signingInput + "." + signatureB64;
        } catch (Exception e) {
            throw new RuntimeException("Error generando JWT HS256: " + e.getMessage(), e);
        }
    }

    private static String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return base64UrlEncode(raw);
    }

    private static String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // JSON mínimo sin dependencias (para valores simples)
    private static String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder();
        sb.append('{');
        boolean first = true;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (!first) sb.append(',');
            first = false;
            sb.append('"').append(escape(e.getKey())).append('"').append(':');
            Object v = e.getValue();
            if (v == null) {
                sb.append("null");
            } else if (v instanceof Number || v instanceof Boolean) {
                sb.append(v.toString());
            } else {
                sb.append('"').append(escape(String.valueOf(v))).append('"');
            }
        }
        sb.append('}');
        return sb.toString();
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}

