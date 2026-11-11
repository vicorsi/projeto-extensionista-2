package br.com.ebdgestao.repository;

import br.com.ebdgestao.domain.PlanoLicao;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlanoLicaoRepository extends JpaRepository<PlanoLicao, UUID> {

    @EntityGraph(attributePaths = "classe")
    List<PlanoLicao> findByClasseIdOrderByNumeroLicaoAsc(UUID classeId);

    @Override
    @EntityGraph(attributePaths = "classe")
    List<PlanoLicao> findAll();
}
