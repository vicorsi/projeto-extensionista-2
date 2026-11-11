package br.com.ebdgestao.dto;

import br.com.ebdgestao.domain.ClasseEbd;
import br.com.ebdgestao.domain.Enums.TipoMembro;
import br.com.ebdgestao.domain.Membro;
import br.com.ebdgestao.domain.PlanoLicao;
import br.com.ebdgestao.domain.Usuario;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/** DTOs de Classes, Membros e Planos de Lições. */
public final class CadastroDtos {

    private CadastroDtos() {
    }

    // ---------- Classes ----------

    public record ClasseDTO(UUID id, String nome, String faixaEtaria, String descricao,
                            UUID professorTitularId, String professorTitularNome,
                            long totalMembros, OffsetDateTime createdAt) {
        public static ClasseDTO of(ClasseEbd c, long totalMembros) {
            Usuario p = c.getProfessorTitular();
            return new ClasseDTO(c.getId(), c.getNome(), c.getFaixaEtaria(), c.getDescricao(),
                    p != null ? p.getId() : null, p != null ? p.getNome() : null,
                    totalMembros, c.getCreatedAt());
        }
    }

    public record ClasseRequest(
            @NotBlank(message = "Informe o nome da classe") @Size(max = 100) String nome,
            @Size(max = 60) String faixaEtaria,
            @Size(max = 500) String descricao,
            UUID professorTitularId) {
    }

    // ---------- Membros ----------

    public record MembroDTO(UUID id, String nome, UUID classeId, String classeNome, TipoMembro tipoMembro,
                            String telefone, boolean ativo, OffsetDateTime createdAt) {
        public static MembroDTO of(Membro m) {
            return new MembroDTO(m.getId(), m.getNome(), m.getClasse().getId(), m.getClasse().getNome(),
                    m.getTipoMembro(), m.getTelefone(), Boolean.TRUE.equals(m.getAtivo()), m.getCreatedAt());
        }
    }

    public record MembroRequest(
            @NotBlank(message = "Informe o nome") @Size(max = 150) String nome,
            @NotNull(message = "Selecione a classe") UUID classeId,
            @NotNull(message = "Selecione o tipo") TipoMembro tipoMembro,
            @Size(max = 30, message = "Telefone muito longo") String telefone,
            Boolean ativo) {
    }

    // ---------- Planos de Lições ----------

    public record PlanoLicaoDTO(UUID id, UUID classeId, String classeNome, Integer numeroLicao,
                                String titulo, String textoBiblico, LocalDate dataSugerida) {
        public static PlanoLicaoDTO of(PlanoLicao p) {
            return new PlanoLicaoDTO(p.getId(), p.getClasse().getId(), p.getClasse().getNome(),
                    p.getNumeroLicao(), p.getTitulo(), p.getTextoBiblico(), p.getDataSugerida());
        }
    }

    public record PlanoLicaoRequest(
            @NotNull(message = "Selecione a classe") UUID classeId,
            @Min(value = 1, message = "Número da lição inválido") Integer numeroLicao,
            @NotBlank(message = "Informe o título da lição") @Size(max = 200) String titulo,
            @Size(max = 200) String textoBiblico,
            LocalDate dataSugerida) {
    }
}
