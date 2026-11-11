package br.com.ebdgestao.repository;

import br.com.ebdgestao.domain.EscalaProfessor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EscalaProfessorRepository extends JpaRepository<EscalaProfessor, UUID> {

    @EntityGraph(attributePaths = {"classe", "professor"})
    List<EscalaProfessor> findByDataDomingo(LocalDate dataDomingo);

    Optional<EscalaProfessor> findByClasseIdAndDataDomingo(UUID classeId, LocalDate dataDomingo);
}
