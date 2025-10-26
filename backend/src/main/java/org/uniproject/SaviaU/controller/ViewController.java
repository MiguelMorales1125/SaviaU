package org.uniproject.SaviaU.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    @GetMapping({"/reset"})
    public String resetAlias() {
        return "redirect:/reset.html";
    }

    @GetMapping({"/oauth"})
    public String oauthAlias() {
        return "redirect:/oauth.html";
    }
}

