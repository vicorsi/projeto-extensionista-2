package br.com.ebdgestao.controller;

import br.com.ebdgestao.dto.CadastroDtos.PlanoLicaoDTO;
import br.com.ebdgestao.dto.CadastroDtos.PlanoLicaoRequest;
import br.com.ebdgestao.service.PlanoLicaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/planos-licoes")
@RequiredArgsConstructor
public class PlanoLicaoController {

    private final PlanoLicaoService service;

    @GetMapping
    public List<PlanoLicaoDTO> listar(@RequestParam(required = false) UUID classeId) {
        return service.listar(classeId);
    }

    @PostMapping
    public ResponseEntity<PlanoLicaoDTO> criar(@Valid @RequestBody PlanoLicaoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @PutMapping("/{id}")
    public PlanoLicaoDTO atualizar(@PathVariable UUID id, @Valid @RequestBody PlanoLicaoRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
