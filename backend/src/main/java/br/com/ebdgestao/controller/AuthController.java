package br.com.ebdgestao.controller;

import br.com.ebdgestao.dto.AuthDtos.AuthResponse;
import br.com.ebdgestao.dto.AuthDtos.LoginRequest;
import br.com.ebdgestao.dto.AuthDtos.RegisterRequest;
import br.com.ebdgestao.dto.UsuarioDtos.UsuarioDTO;
import br.com.ebdgestao.security.AuthPrincipal;
import br.com.ebdgestao.service.AuthService;
import br.com.ebdgestao.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @GetMapping("/me")
    public UsuarioDTO me(@AuthenticationPrincipal AuthPrincipal principal) {
        return usuarioService.buscar(principal.id());
    }
}
