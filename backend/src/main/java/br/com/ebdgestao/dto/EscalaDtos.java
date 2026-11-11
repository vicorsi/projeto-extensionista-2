package br.com.ebdgestao.dto;

import br.com.ebdgestao.domain.EscalaProfessor;
import br.com.ebdgestao.domain.Enums.PapelEscala;
import br.com.ebdgestao.domain.Enums.StatusAula;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** DTOs de Escala Dominical e Relatórios. */
public final class EscalaDtos {

    private EscalaDtos() {
    }

    public record EscalaDTO(UUID id, UUID classeId, String classeNome, UUID professorId, String professorNome,
                            LocalDate dataDomingo, PapelEscala papelEscala, String observacao) {
        public static EscalaDTO of(EscalaProfessor e) {
            return new EscalaDTO(e.getId(), e.getClasse().getId(), e.getClasse().getNome(),
                    e.getProfessor().getId(), e.getProfessor().getNome(), e.getDataDomingo(),
                    e.getPapelEscala(), e.getObservacao());
        }
    }

    /** Se {@code professorId} vier nulo, a escala da classe naquele domingo é removida. */
    public record EscalaUpsertRequest(
            @NotNull(message = "Selecione a classe") UUID classeId,
            @NotNull(message = "Informe o domingo") LocalDate dataDomingo,
            UUID professorId,
            PapelEscala papelEscala,
            @Size(max = 300, message = "Observação muito longa") String observacao) {
    }

    public record RelatorioClasseDTO(UUID classeId, String classeNome, String professorEscalado,
                                     UUID aulaId, StatusAula status, Integer numeroLicao, String temaLicao,
                                     long matriculados, long presentes, long ausentes, double frequencia,
                                     long biblias, long revistas, long visitantes, BigDecimal oferta) {
    }

    public record RelatorioConsolidadoDTO(LocalDate dataDomingo, int totalClasses, int aulasIniciadas,
                                          int aulasConcluidas, long matriculados, long presentes,
                                          long ausentes, double frequencia, long biblias, long revistas,
                                          long visitantes, BigDecimal totalOfertas,
                                          List<RelatorioClasseDTO> classes) {
    }
}
