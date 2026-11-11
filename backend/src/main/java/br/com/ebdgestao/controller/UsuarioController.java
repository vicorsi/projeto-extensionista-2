package br.com.ebdgestao.controller;

import br.com.ebdgestao.dto.UsuarioDtos.UsuarioDTO;
import br.com.ebdgestao.dto.UsuarioDtos.UsuarioRequest;
import br.com.ebdgestao.security.AuthPrincipal;
import br.com.ebdgestao.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService service;

    @GetMapping
    public List<UsuarioDTO> listar() {
        return service.listar();
    }

    @PostMapping
    public ResponseEntity<UsuarioDTO> criar(@Valid @RequestBody UsuarioRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @PutMapping("/{id}")
    public UsuarioDTO atualizar(@PathVariable UUID id, @Valid @RequestBody UsuarioRequest req,
                                @AuthenticationPrincipal AuthPrincipal principal) {
        return service.atualizar(id, req, principal.id());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal principal) {
        service.excluir(id, principal.id());
        return ResponseEntity.noContent().build();
    }
}
