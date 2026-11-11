package br.com.ebdgestao.controller;

import br.com.ebdgestao.dto.EscalaDtos.EscalaDTO;
import br.com.ebdgestao.dto.EscalaDtos.EscalaUpsertRequest;
import br.com.ebdgestao.service.EscalaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/escalas")
@RequiredArgsConstructor
public class EscalaController {

    private final EscalaService service;

    @GetMapping
    public List<EscalaDTO> listar(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataDomingo) {
        return service.listar(dataDomingo);
    }

    /** 200 com a escala salva, ou 204 se a escala foi removida (professorId nulo). */
    @PutMapping("/upsert")
    public ResponseEntity<EscalaDTO> upsert(@Valid @RequestBody EscalaUpsertRequest req) {
        EscalaDTO dto = service.upsert(req);
        return dto == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
    }

    @PostMapping("/replicar-titulares")
    public List<EscalaDTO> replicarTitulares(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataDomingo) {
        return service.replicarTitulares(dataDomingo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
