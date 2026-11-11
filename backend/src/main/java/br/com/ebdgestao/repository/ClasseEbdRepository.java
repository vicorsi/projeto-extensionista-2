package br.com.ebdgestao.repository;

import br.com.ebdgestao.domain.ClasseEbd;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClasseEbdRepository extends JpaRepository<ClasseEbd, UUID> {

    @EntityGraph(attributePaths = "professorTitular")
    List<ClasseEbd> findAllByOrderByNomeAsc();
}
