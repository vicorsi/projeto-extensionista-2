package br.com.ebdgestao.repository;

import br.com.ebdgestao.domain.Aula;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AulaRepository extends JpaRepository<Aula, UUID> {

    @EntityGraph(attributePaths = "classe")
    Optional<Aula> findByClasseIdAndDataAula(UUID classeId, LocalDate dataAula);

    @EntityGraph(attributePaths = "classe")
    List<Aula> findByClasseIdOrderByDataAulaDesc(UUID classeId);

    @EntityGraph(attributePaths = "classe")
    List<Aula> findByDataAula(LocalDate dataAula);
}
