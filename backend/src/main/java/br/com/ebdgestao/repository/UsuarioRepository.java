package br.com.ebdgestao.repository;

import br.com.ebdgestao.domain.Enums.Papel;
import br.com.ebdgestao.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);

    long countByPapel(Papel papel);

    List<Usuario> findAllByOrderByNomeAsc();
}
