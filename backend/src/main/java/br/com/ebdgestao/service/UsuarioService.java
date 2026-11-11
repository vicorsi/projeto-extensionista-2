package br.com.ebdgestao.service;

import br.com.ebdgestao.domain.Enums.Papel;
import br.com.ebdgestao.domain.Usuario;
import br.com.ebdgestao.dto.UsuarioDtos.UsuarioDTO;
import br.com.ebdgestao.dto.UsuarioDtos.UsuarioRequest;
import br.com.ebdgestao.exception.ApiException;
import br.com.ebdgestao.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsuarioDTO> listar() {
        return repository.findAllByOrderByNomeAsc().stream().map(UsuarioDTO::of).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioDTO buscar(UUID id) {
        return UsuarioDTO.of(obter(id));
    }

    public Usuario obter(UUID id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
    }

    @Transactional
    public Usuario criarEntidade(String nome, String email, String senha, Papel papel) {
        String emailNormalizado = normalizarEmail(email);
        if (repository.existsByEmailIgnoreCase(emailNormalizado)) {
            throw ApiException.conflict("Já existe um usuário cadastrado com este e-mail");
        }
        validarSenha(senha);
        Usuario u = new Usuario();
        u.setNome(nome.trim());
        u.setEmail(emailNormalizado);
        u.setSenhaHash(passwordEncoder.encode(senha));
        u.setPapel(papel);
        return repository.save(u);
    }

    @Transactional
    public UsuarioDTO criar(UsuarioRequest req) {
        return UsuarioDTO.of(criarEntidade(req.nome(), req.email(), req.senha(), req.papel()));
    }

    @Transactional
    public UsuarioDTO atualizar(UUID id, UsuarioRequest req, UUID solicitanteId) {
        Usuario u = obter(id);
        String email = normalizarEmail(req.email());
        if (repository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw ApiException.conflict("Já existe um usuário cadastrado com este e-mail");
        }
        boolean perdeSuperintendencia = u.getPapel() == Papel.SUPERINTENDENTE && req.papel() != Papel.SUPERINTENDENTE;
        if (perdeSuperintendencia && id.equals(solicitanteId)) {
            throw ApiException.badRequest("Você não pode remover o seu próprio acesso de superintendente");
        }
        if (perdeSuperintendencia && repository.countByPapel(Papel.SUPERINTENDENTE) <= 1) {
            throw ApiException.conflict("É necessário manter ao menos um superintendente");
        }
        u.setNome(req.nome().trim());
        u.setEmail(email);
        u.setPapel(req.papel());
        if (req.senha() != null && !req.senha().isBlank()) {
            validarSenha(req.senha());
            u.setSenhaHash(passwordEncoder.encode(req.senha()));
        }
        return UsuarioDTO.of(u);
    }

    @Transactional
    public void excluir(UUID id, UUID solicitanteId) {
        if (id.equals(solicitanteId)) {
            throw ApiException.badRequest("Você não pode excluir a sua própria conta");
        }
        Usuario u = obter(id);
        if (u.getPapel() == Papel.SUPERINTENDENTE && repository.countByPapel(Papel.SUPERINTENDENTE) <= 1) {
            throw ApiException.conflict("É necessário manter ao menos um superintendente");
        }
        repository.delete(u);
    }

    private static void validarSenha(String senha) {
        if (senha == null || senha.length() < 6) {
            throw ApiException.badRequest("A senha deve ter no mínimo 6 caracteres");
        }
    }

    private static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
