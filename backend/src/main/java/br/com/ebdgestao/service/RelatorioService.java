package br.com.ebdgestao.service;

import br.com.ebdgestao.domain.Aula;
import br.com.ebdgestao.domain.Chamada;
import br.com.ebdgestao.domain.ClasseEbd;
import br.com.ebdgestao.domain.EscalaProfessor;
import br.com.ebdgestao.domain.Enums.StatusAula;
import br.com.ebdgestao.domain.Enums.TipoMembro;
import br.com.ebdgestao.dto.EscalaDtos.RelatorioClasseDTO;
import br.com.ebdgestao.dto.EscalaDtos.RelatorioConsolidadoDTO;
import br.com.ebdgestao.repository.AulaRepository;
import br.com.ebdgestao.repository.ChamadaRepository;
import br.com.ebdgestao.repository.ClasseEbdRepository;
import br.com.ebdgestao.repository.EscalaProfessorRepository;
import br.com.ebdgestao.repository.MembroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Regras do relatório:
 * - Matriculados: pessoas ativas do tipo MEMBRO na classe;
 * - Presentes: todos os presentes (membros + visitantes);
 * - Frequência: membros presentes / matriculados;
 * - Visitantes: visitantes presentes.
 */
@Service
@RequiredArgsConstructor
public class RelatorioService {

    private final ClasseEbdRepository classeRepository;
    private final AulaRepository aulaRepository;
    private final ChamadaRepository chamadaRepository;
    private final MembroRepository membroRepository;
    private final EscalaProfessorRepository escalaRepository;

    @Transactional(readOnly = true)
    public RelatorioConsolidadoDTO consolidado(LocalDate data) {
        List<ClasseEbd> classes = classeRepository.findAllByOrderByNomeAsc();
        Map<UUID, Aula> aulas = aulaRepository.findByDataAula(data).stream()
                .collect(Collectors.toMap(a -> a.getClasse().getId(), Function.identity()));
        Map<UUID, EscalaProfessor> escalas = escalaRepository.findByDataDomingo(data).stream()
                .collect(Collectors.toMap(e -> e.getClasse().getId(), Function.identity()));
        Map<UUID, Long> matriculadosPorClasse =
                ClasseService.paraMapa(membroRepository.contarAtivosPorClasseETipo(TipoMembro.MEMBRO));

        List<UUID> aulaIds = aulas.values().stream().map(Aula::getId).toList();
        Map<UUID, List<Chamada>> chamadasPorAula = aulaIds.isEmpty() ? Map.of()
                : chamadaRepository.findByAulaIdIn(aulaIds).stream()
                .collect(Collectors.groupingBy(c -> c.getAula().getId()));

        List<RelatorioClasseDTO> linhas = new ArrayList<>();
        long tMatriculados = 0, tPresentes = 0, tMembrosPresentes = 0, tBiblias = 0, tRevistas = 0, tVisitantes = 0;
        BigDecimal tOfertas = BigDecimal.ZERO;
        int iniciadas = 0, concluidas = 0;

        for (ClasseEbd classe : classes) {
            Aula aula = aulas.get(classe.getId());
            EscalaProfessor escala = escalas.get(classe.getId());
            long matriculados = matriculadosPorClasse.getOrDefault(classe.getId(), 0L);
            long presentes = 0, membrosPresentes = 0, biblias = 0, revistas = 0, visitantes = 0;
            BigDecimal oferta = BigDecimal.ZERO;

            if (aula != null) {
                iniciadas++;
                if (aula.getStatus() == StatusAula.CONCLUIDA) {
                    concluidas++;
                }
                for (Chamada c : chamadasPorAula.getOrDefault(aula.getId(), List.of())) {
                    if (Boolean.TRUE.equals(c.getPresente())) {
                        presentes++;
                        if (c.getMembro().getTipoMembro() == TipoMembro.VISITANTE) {
                            visitantes++;
                        } else {
                            membrosPresentes++;
                        }
                    }
                    if (Boolean.TRUE.equals(c.getTrouxeBiblia())) {
                        biblias++;
                    }
                    if (Boolean.TRUE.equals(c.getTrouxeRevista())) {
                        revistas++;
                    }
                }
                if (aula.getValorOferta() != null) {
                    oferta = aula.getValorOferta();
                }
            }

            linhas.add(new RelatorioClasseDTO(
                    classe.getId(), classe.getNome(),
                    escala != null ? escala.getProfessor().getNome() : null,
                    aula != null ? aula.getId() : null,
                    aula != null ? aula.getStatus() : null,
                    aula != null ? aula.getNumeroLicao() : null,
                    aula != null ? aula.getTemaLicao() : null,
                    matriculados, presentes, Math.max(0, matriculados - membrosPresentes),
                    percentual(membrosPresentes, matriculados),
                    biblias, revistas, visitantes, oferta));

            tMatriculados += matriculados;
            tPresentes += presentes;
            tMembrosPresentes += membrosPresentes;
            tBiblias += biblias;
            tRevistas += revistas;
            tVisitantes += visitantes;
            tOfertas = tOfertas.add(oferta);
        }

        return new RelatorioConsolidadoDTO(data, classes.size(), iniciadas, concluidas,
                tMatriculados, tPresentes, Math.max(0, tMatriculados - tMembrosPresentes),
                percentual(tMembrosPresentes, tMatriculados),
                tBiblias, tRevistas, tVisitantes, tOfertas, linhas);
    }

    private static double percentual(long parte, long total) {
        if (total <= 0) {
            return 0.0;
        }
        return Math.round(parte * 1000.0 / total) / 10.0;
    }
}
