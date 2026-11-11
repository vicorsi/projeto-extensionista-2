package br.com.ebdgestao.controller;

import br.com.ebdgestao.dto.AulaDtos.ChamadaDTO;
import br.com.ebdgestao.dto.AulaDtos.ChamadaLoteRequest;
import br.com.ebdgestao.dto.AulaDtos.ChamadaUpsertRequest;
import br.com.ebdgestao.service.ChamadaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chamadas")
@RequiredArgsConstructor
public class ChamadaController {

    private final ChamadaService service;

    @GetMapping
    public List<ChamadaDTO> listar(@RequestParam UUID aulaId) {
        return service.listar(aulaId);
    }

    @PutMapping("/upsert")
    public ChamadaDTO upsert(@Valid @RequestBody ChamadaUpsertRequest req) {
        return service.upsert(req);
    }

    @PostMapping("/marcar-todos")
    public List<ChamadaDTO> marcarTodos(@Valid @RequestBody ChamadaLoteRequest req) {
        return service.marcarTodos(req.aulaId());
    }

    @PostMapping("/resetar")
    public List<ChamadaDTO> resetar(@Valid @RequestBody ChamadaLoteRequest req) {
        return service.resetar(req.aulaId());
    }
}
