package br.com.ebdgestao.service;

import br.com.ebdgestao.domain.ClasseEbd;
import br.com.ebdgestao.domain.EscalaProfessor;
import br.com.ebdgestao.domain.Enums.PapelEscala;
import br.com.ebdgestao.dto.EscalaDtos.EscalaDTO;
import br.com.ebdgestao.dto.EscalaDtos.EscalaUpsertRequest;
import br.com.ebdgestao.exception.ApiException;
import br.com.ebdgestao.repository.ClasseEbdRepository;
import br.com.ebdgestao.repository.EscalaProfessorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EscalaService {

    private final EscalaProfessorRepository repository;
    private final ClasseEbdRepository classeRepository;
    private final ClasseService classeService;
    private final UsuarioService usuarioService;

    @Transactional(readOnly = true)
    public List<EscalaDTO> listar(LocalDate dataDomingo) {
        return repository.findByDataDomingo(dataDomingo).stream()
                .map(EscalaDTO::of)
                .sorted(Comparator.comparing(EscalaDTO::classeNome, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    /** Retorna {@code null} quando a escala foi removida (professorId nulo). */
    @Transactional
    public EscalaDTO upsert(EscalaUpsertRequest req) {
        var existente = repository.findByClasseIdAndDataDomingo(req.classeId(), req.dataDomingo());
        if (req.professorId() == null) {
            existente.ifPresent(repository::delete);
            return null;
        }
        EscalaProfessor e = existente.orElseGet(() -> {
            EscalaProfessor nova = new EscalaProfessor();
            nova.setClasse(classeService.obter(req.classeId()));
            nova.setDataDomingo(req.dataDomingo());
            return nova;
        });
        e.setProfessor(usuarioService.obter(req.professorId()));
        e.setPapelEscala(req.papelEscala() != null ? req.papelEscala() : PapelEscala.TITULAR);
        e.setObservacao(Texto.limpar(req.observacao()));
        return EscalaDTO.of(repository.save(e));
    }

    @Transactional
    public List<EscalaDTO> replicarTitulares(LocalDate dataDomingo) {
        Set<UUID> jaEscaladas = repository.findByDataDomingo(dataDomingo).stream()
                .map(e -> e.getClasse().getId())
                .collect(Collectors.toSet());
        for (ClasseEbd classe : classeRepository.findAllByOrderByNomeAsc()) {
            if (classe.getProfessorTitular() == null || jaEscaladas.contains(classe.getId())) {
                continue;
            }
            EscalaProfessor e = new EscalaProfessor();
            e.setClasse(classe);
            e.setProfessor(classe.getProfessorTitular());
            e.setDataDomingo(dataDomingo);
            e.setPapelEscala(PapelEscala.TITULAR);
            repository.save(e);
        }
        repository.flush();
        return listar(dataDomingo);
    }

    @Transactional
    public void excluir(UUID id) {
        repository.delete(repository.findById(id).orElseThrow(() -> ApiException.notFound("Escala não encontrada")));
    }
}
