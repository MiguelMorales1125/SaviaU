package org.uniproject.SaviaU.security.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.uniproject.SaviaU.config.SupabaseProperties;
import org.uniproject.SaviaU.security.util.JwtUtil;

import java.io.IOException;
import java.util.Map;

@Component
public class AdminJwtFilter implements Filter {

    private final SupabaseProperties props;

    public AdminJwtFilter(@Qualifier("supabaseProperties") SupabaseProperties props) {
        this.props = props;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (!(request instanceof HttpServletRequest req) || !(response instanceof HttpServletResponse res)) {
            chain.doFilter(request, response);
            return;
        }

        String path = req.getRequestURI();
        String method = req.getMethod();

        // Permitir preflight CORS sin autenticación
        if ("OPTIONS".equalsIgnoreCase(method)) {
            chain.doFilter(request, response);
            return;
        }
        // Proteger todas las rutas /api/admin/** excepto /api/admin/auth/**
        if (path.startsWith("/api/admin/") && !path.startsWith("/api/admin/auth/")) {
            String authHeader = req.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                unauthorized(res, "missing_or_invalid_authorization_header");
                return;
            }
            String token = authHeader.substring("Bearer ".length()).trim();
            try {
                Map<String, Object> claims = JwtUtil.validateHs256AndGetClaims(token, props.getJwtSecret());
                Object role = claims.get("role");
                if (role == null || !"admin".equals(String.valueOf(role))) {
                    unauthorized(res, "forbidden_role");
                    return;
                }
                // Opcionalmente propagar claims para capas posteriores
                req.setAttribute("adminClaims", claims);
            } catch (RuntimeException ex) {
                unauthorized(res, ex.getMessage());
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private void unauthorized(HttpServletResponse res, String reason) throws IOException {
        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        res.setHeader("WWW-Authenticate", "Bearer error=\"invalid_token\", error_description=\"" + sanitize(reason) + "\"");
        res.setContentType("application/json");
        res.getWriter().write("{\"message\":\"No autorizado\"}");
    }

    private String sanitize(String s) {
        return s == null ? "" : s.replaceAll("[\r\n\\\"]", " ");
    }
}
