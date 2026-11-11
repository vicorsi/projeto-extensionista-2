package br.com.ebdgestao.repository;

import br.com.ebdgestao.domain.Enums.TipoMembro;
import br.com.ebdgestao.domain.Membro;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MembroRepository extends JpaRepository<Membro, UUID> {

    @EntityGraph(attributePaths = "classe")
    List<Membro> findAllByOrderByNomeAsc();

    @EntityGraph(attributePaths = "classe")
    List<Membro> findByClasseIdOrderByNomeAsc(UUID classeId);

    @EntityGraph(attributePaths = "classe")
    List<Membro> findByTipoMembroOrderByNomeAsc(TipoMembro tipo);

    @EntityGraph(attributePaths = "classe")
    List<Membro> findByClasseIdAndTipoMembroOrderByNomeAsc(UUID classeId, TipoMembro tipo);

    List<Membro> findByClasseIdAndAtivoTrue(UUID classeId);

    /** Retorna pares [classeId, total] de pessoas ativas (membros + visitantes). */
    @Query("select m.classe.id, count(m) from Membro m where m.ativo = true group by m.classe.id")
    List<Object[]> contarAtivosPorClasse();

    /** Retorna pares [classeId, total] de pessoas ativas de um tipo. */
    @Query("select m.classe.id, count(m) from Membro m where m.ativo = true and m.tipoMembro = :tipo group by m.classe.id")
    List<Object[]> contarAtivosPorClasseETipo(@Param("tipo") TipoMembro tipo);
}
