package br.com.ebdgestao.service;

import br.com.ebdgestao.domain.Enums.Papel;
import br.com.ebdgestao.domain.Usuario;
import br.com.ebdgestao.dto.AuthDtos.AuthResponse;
import br.com.ebdgestao.dto.AuthDtos.LoginRequest;
import br.com.ebdgestao.dto.AuthDtos.RegisterRequest;
import br.com.ebdgestao.dto.UsuarioDtos.UsuarioDTO;
import br.com.ebdgestao.exception.ApiException;
import br.com.ebdgestao.repository.UsuarioRepository;
import br.com.ebdgestao.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final JwtService jwtService;

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, req.senha()));
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("E-mail ou senha inválidos"));
        return new AuthResponse(jwtService.gerarToken(usuario), UsuarioDTO.of(usuario));
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.papel() != Papel.SUPERINTENDENTE && req.papel() != Papel.PROFESSOR) {
            throw ApiException.badRequest("Papel inválido para cadastro");
        }
        Usuario usuario = usuarioService.criarEntidade(req.nome(), req.email(), req.senha(), req.papel());
        return new AuthResponse(jwtService.gerarToken(usuario), UsuarioDTO.of(usuario));
    }
}
