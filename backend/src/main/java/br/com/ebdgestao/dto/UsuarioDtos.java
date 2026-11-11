package br.com.ebdgestao.dto;

import br.com.ebdgestao.domain.Enums.Papel;
import br.com.ebdgestao.domain.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public final class UsuarioDtos {

    private UsuarioDtos() {
    }

    public record UsuarioDTO(UUID id, String nome, String email, Papel papel, OffsetDateTime createdAt) {
        public static UsuarioDTO of(Usuario u) {
            return new UsuarioDTO(u.getId(), u.getNome(), u.getEmail(), u.getPapel(), u.getCreatedAt());
        }
    }

    /** Senha é obrigatória na criação e opcional na edição (mantém a atual se vazia). */
    public record UsuarioRequest(
            @NotBlank(message = "Informe o nome") @Size(max = 150, message = "Nome muito longo") String nome,
            @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido") @Size(max = 180) String email,
            @Size(max = 100, message = "Senha muito longa") String senha,
            @NotNull(message = "Informe o papel") Papel papel) {
    }
}
