package br.com.ebdgestao.dto;

import br.com.ebdgestao.domain.Aula;
import br.com.ebdgestao.domain.Chamada;
import br.com.ebdgestao.domain.Enums.StatusAula;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/** DTOs de Aulas e Chamada. */
public final class AulaDtos {

    private AulaDtos() {
    }

    public record AulaDTO(UUID id, UUID classeId, String classeNome, LocalDate dataAula, Integer numeroLicao,
                          String temaLicao, String leituraBiblica, BigDecimal valorOferta, StatusAula status,
                          long presentes, OffsetDateTime createdAt) {
        public static AulaDTO of(Aula a, long presentes) {
            return new AulaDTO(a.getId(), a.getClasse().getId(), a.getClasse().getNome(), a.getDataAula(),
                    a.getNumeroLicao(), a.getTemaLicao(), a.getLeituraBiblica(), a.getValorOferta(),
                    a.getStatus(), presentes, a.getCreatedAt());
        }
    }

    public record ObterOuCriarAulaRequest(
            @NotNull(message = "Selecione a classe") UUID classeId,
            @NotNull(message = "Informe a data da aula") LocalDate dataAula) {
    }

    public record AulaUpdateRequest(
            @Min(value = 1, message = "Número da lição inválido") Integer numeroLicao,
            @Size(max = 200) String temaLicao,
            @Size(max = 200) String leituraBiblica,
            @DecimalMin(value = "0.00", message = "A oferta não pode ser negativa")
            @Digits(integer = 8, fraction = 2, message = "Valor de oferta inválido") BigDecimal valorOferta,
            StatusAula status) {
    }

    public record ChamadaDTO(UUID id, UUID aulaId, UUID membroId, boolean presente, boolean trouxeBiblia,
                             boolean trouxeRevista, OffsetDateTime updatedAt) {
        public static ChamadaDTO of(Chamada c) {
            return new ChamadaDTO(c.getId(), c.getAula().getId(), c.getMembro().getId(),
                    Boolean.TRUE.equals(c.getPresente()), Boolean.TRUE.equals(c.getTrouxeBiblia()),
                    Boolean.TRUE.equals(c.getTrouxeRevista()), c.getUpdatedAt());
        }
    }

    public record ChamadaUpsertRequest(
            @NotNull(message = "Aula não informada") UUID aulaId,
            @NotNull(message = "Aluno não informado") UUID membroId,
            Boolean presente,
            Boolean trouxeBiblia,
            Boolean trouxeRevista) {
    }

    public record ChamadaLoteRequest(@NotNull(message = "Aula não informada") UUID aulaId) {
    }
}
