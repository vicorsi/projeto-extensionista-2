package br.com.ebdgestao.controller;

import br.com.ebdgestao.dto.AulaDtos.AulaDTO;
import br.com.ebdgestao.dto.AulaDtos.AulaUpdateRequest;
import br.com.ebdgestao.dto.AulaDtos.ObterOuCriarAulaRequest;
import br.com.ebdgestao.service.AulaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/aulas")
@RequiredArgsConstructor
public class AulaController {

    private final AulaService service;

    @PostMapping("/obter-ou-criar")
    public AulaDTO obterOuCriar(@Valid @RequestBody ObterOuCriarAulaRequest req) {
        return service.obterOuCriar(req);
    }

    @PutMapping("/{id}")
    public AulaDTO atualizar(@PathVariable UUID id, @Valid @RequestBody AulaUpdateRequest req) {
        return service.atualizar(id, req);
    }

    @GetMapping("/historico")
    public List<AulaDTO> historico(@RequestParam UUID classeId) {
        return service.historico(classeId);
    }
}
