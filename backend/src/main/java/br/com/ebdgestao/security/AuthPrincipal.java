package br.com.ebdgestao.security;

import br.com.ebdgestao.domain.Enums.Papel;

import java.util.UUID;

/** Usuário autenticado disponível via {@code @AuthenticationPrincipal}. */
public record AuthPrincipal(UUID id, String nome, String email, Papel papel) {
}
