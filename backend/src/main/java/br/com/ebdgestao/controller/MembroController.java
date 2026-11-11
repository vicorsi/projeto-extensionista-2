package br.com.ebdgestao.controller;

import br.com.ebdgestao.domain.Enums.TipoMembro;
import br.com.ebdgestao.dto.CadastroDtos.MembroDTO;
import br.com.ebdgestao.dto.CadastroDtos.MembroRequest;
import br.com.ebdgestao.service.MembroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/membros")
@RequiredArgsConstructor
public class MembroController {

    private final MembroService service;

    @GetMapping
    public List<MembroDTO> listar(@RequestParam(required = false) UUID classeId,
                                  @RequestParam(required = false) TipoMembro tipo) {
        return service.listar(classeId, tipo);
    }

    @PostMapping
    public ResponseEntity<MembroDTO> criar(@Valid @RequestBody MembroRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @PutMapping("/{id}")
    public MembroDTO atualizar(@PathVariable UUID id, @Valid @RequestBody MembroRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
