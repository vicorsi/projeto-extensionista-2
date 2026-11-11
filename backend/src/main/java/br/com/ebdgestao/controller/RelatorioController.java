package br.com.ebdgestao.controller;

import br.com.ebdgestao.dto.EscalaDtos.RelatorioConsolidadoDTO;
import br.com.ebdgestao.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final RelatorioService service;

    @GetMapping("/consolidado")
    public RelatorioConsolidadoDTO consolidado(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataDomingo) {
        return service.consolidado(dataDomingo);
    }
}
