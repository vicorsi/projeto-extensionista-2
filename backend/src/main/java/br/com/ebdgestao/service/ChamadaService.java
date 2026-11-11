package br.com.ebdgestao.service;

import br.com.ebdgestao.domain.Aula;
import br.com.ebdgestao.domain.Chamada;
import br.com.ebdgestao.domain.Membro;
import br.com.ebdgestao.dto.AulaDtos.ChamadaDTO;
import br.com.ebdgestao.dto.AulaDtos.ChamadaUpsertRequest;
import br.com.ebdgestao.exception.ApiException;
import br.com.ebdgestao.repository.AulaRepository;
import br.com.ebdgestao.repository.ChamadaRepository;
import br.com.ebdgestao.repository.MembroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChamadaService {

    private final ChamadaRepository repository;
    private final AulaRepository aulaRepository;
    private final MembroRepository membroRepository;

    @Transactional(readOnly = true)
    public List<ChamadaDTO> listar(UUID aulaId) {
        return repository.findByAulaId(aulaId).stream().map(ChamadaDTO::of).toList();
    }

    /**
     * Regras de negócio aplicadas também no servidor:
     * - Bíblia ou Revista marcadas implicam Presente = true;
     * - Ausente implica Bíblia = Revista = false.
     */
    @Transactional
    public ChamadaDTO upsert(ChamadaUpsertRequest req) {
        Aula aula = obterAula(req.aulaId());
        Membro membro = membroRepository.findById(req.membroId())
                .orElseThrow(() -> ApiException.notFound("Aluno não encontrado"));
        if (!membro.getClasse().getId().equals(aula.getClasse().getId())) {
            throw ApiException.badRequest("Este aluno não pertence à classe da aula");
        }

        boolean biblia = Boolean.TRUE.equals(req.trouxeBiblia());
        boolean revista = Boolean.TRUE.equals(req.trouxeRevista());
        boolean presente = Boolean.TRUE.equals(req.presente()) || biblia || revista;

        Chamada c = repository.findByAulaIdAndMembroId(aula.getId(), membro.getId()).orElseGet(() -> {
            Chamada nova = new Chamada();
            nova.setAula(aula);
            nova.setMembro(membro);
            return nova;
        });
        c.setPresente(presente);
        c.setTrouxeBiblia(presente && biblia);
        c.setTrouxeRevista(presente && revista);
        return ChamadaDTO.of(repository.saveAndFlush(c));
    }

    @Transactional
    public List<ChamadaDTO> marcarTodos(UUID aulaId) {
        Aula aula = obterAula(aulaId);
        Map<UUID, Chamada> existentes = repository.findByAulaId(aulaId).stream()
                .collect(Collectors.toMap(c -> c.getMembro().getId(), Function.identity()));
        List<Chamada> alterar = new ArrayList<>();
        for (Membro m : membroRepository.findByClasseIdAndAtivoTrue(aula.getClasse().getId())) {
            Chamada c = existentes.get(m.getId());
            if (c == null) {
                c = new Chamada();
                c.setAula(aula);
                c.setMembro(m);
            }
            c.setPresente(true);
            alterar.add(c);
        }
        repository.saveAll(alterar);
        repository.flush();
        return listar(aulaId);
    }

    @Transactional
    public List<ChamadaDTO> resetar(UUID aulaId) {
        obterAula(aulaId);
        repository.excluirPorAula(aulaId);
        return List.of();
    }

    private Aula obterAula(UUID id) {
        return aulaRepository.findById(id).orElseThrow(() -> ApiException.notFound("Aula não encontrada"));
    }
}
