package br.com.ebdgestao.dto;

import br.com.ebdgestao.domain.Enums.Papel;
import br.com.ebdgestao.dto.UsuarioDtos.UsuarioDTO;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido") String email,
            @NotBlank(message = "Informe a senha") String senha) {
    }

    public record RegisterRequest(
            @NotBlank(message = "Informe o nome completo") @Size(max = 150) String nome,
            @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido") @Size(max = 180) String email,
            @NotBlank(message = "Informe a senha") @Size(min = 6, max = 100, message = "A senha deve ter no mínimo 6 caracteres") String senha,
            @NotNull(message = "Selecione o papel") Papel papel) {
    }

    public record AuthResponse(String token, UsuarioDTO usuario) {
    }
}
