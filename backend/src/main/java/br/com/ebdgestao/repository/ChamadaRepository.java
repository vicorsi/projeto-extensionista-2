package br.com.ebdgestao.repository;

import br.com.ebdgestao.domain.Chamada;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChamadaRepository extends JpaRepository<Chamada, UUID> {

    List<Chamada> findByAulaId(UUID aulaId);

    Optional<Chamada> findByAulaIdAndMembroId(UUID aulaId, UUID membroId);

    @EntityGraph(attributePaths = "membro")
    List<Chamada> findByAulaIdIn(Collection<UUID> aulaIds);

    /** Retorna pares [aulaId, totalPresentes]. */
    @Query("select c.aula.id, count(c) from Chamada c where c.presente = true and c.aula.id in :ids group by c.aula.id")
    List<Object[]> contarPresentesPorAula(@Param("ids") Collection<UUID> aulaIds);

    @Modifying
    @Query("delete from Chamada c where c.aula.id = :aulaId")
    int excluirPorAula(@Param("aulaId") UUID aulaId);
}
