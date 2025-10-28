package org.uniproject.SaviaU.controller.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/protected")
public class AdminProtectedController {

    @GetMapping("/ping")
    public Map<String, Object> ping(@RequestAttribute(name = "adminClaims", required = false) Map<String, Object> claims) {
        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "pong");
        if (claims != null) {
            resp.put("email", claims.get("email"));
            resp.put("sub", claims.get("sub"));
            resp.put("role", claims.get("role"));
        }
        return resp;
    }
}

