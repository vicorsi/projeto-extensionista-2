package br.com.ebdgestao.controller;

import br.com.ebdgestao.dto.CadastroDtos.ClasseDTO;
import br.com.ebdgestao.dto.CadastroDtos.ClasseRequest;
import br.com.ebdgestao.service.ClasseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClasseController {

    private final ClasseService service;

    @GetMapping
    public List<ClasseDTO> listar() {
        return service.listar();
    }

    @PostMapping
    public ResponseEntity<ClasseDTO> criar(@Valid @RequestBody ClasseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @PutMapping("/{id}")
    public ClasseDTO atualizar(@PathVariable UUID id, @Valid @RequestBody ClasseRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
