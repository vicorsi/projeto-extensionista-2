package br.com.ebdgestao.service;

import br.com.ebdgestao.domain.Aula;
import br.com.ebdgestao.domain.ClasseEbd;
import br.com.ebdgestao.domain.Enums.StatusAula;
import br.com.ebdgestao.dto.AulaDtos.AulaDTO;
import br.com.ebdgestao.dto.AulaDtos.AulaUpdateRequest;
import br.com.ebdgestao.dto.AulaDtos.ObterOuCriarAulaRequest;
import br.com.ebdgestao.exception.ApiException;
import br.com.ebdgestao.repository.AulaRepository;
import br.com.ebdgestao.repository.ChamadaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AulaService {

    private final AulaRepository repository;
    private final ChamadaRepository chamadaRepository;
    private final ClasseService classeService;

    /**
     * Retorna a aula da classe na data informada, criando-a se ainda não existir.
     * Sem transação externa de propósito: se dois professores abrirem a mesma aula ao mesmo
     * tempo, a constraint única garante um único registro e o segundo apenas o relê.
     */
    public AulaDTO obterOuCriar(ObterOuCriarAulaRequest req) {
        ClasseEbd classe = classeService.obter(req.classeId());
        Aula aula = repository.findByClasseIdAndDataAula(classe.getId(), req.dataAula()).orElseGet(() -> {
            try {
                Aula nova = new Aula();
                nova.setClasse(classe);
                nova.setDataAula(req.dataAula());
                nova.setStatus(StatusAula.ABERTA);
                return repository.saveAndFlush(nova);
            } catch (DataIntegrityViolationException e) {
                return repository.findByClasseIdAndDataAula(classe.getId(), req.dataAula()).orElseThrow(() -> e);
            }
        });
        return AulaDTO.of(aula, contarPresentes(aula.getId()));
    }

    @Transactional
    public AulaDTO atualizar(UUID id, AulaUpdateRequest req) {
        Aula aula = repository.findById(id).orElseThrow(() -> ApiException.notFound("Aula não encontrada"));
        aula.setNumeroLicao(req.numeroLicao());
        aula.setTemaLicao(Texto.limpar(req.temaLicao()));
        aula.setLeituraBiblica(Texto.limpar(req.leituraBiblica()));
        aula.setValorOferta(req.valorOferta());
        if (req.status() != null) {
            aula.setStatus(req.status());
        }
        return AulaDTO.of(aula, contarPresentes(id));
    }

    @Transactional(readOnly = true)
    public List<AulaDTO> historico(UUID classeId) {
        List<Aula> aulas = repository.findByClasseIdOrderByDataAulaDesc(classeId);
        if (aulas.isEmpty()) {
            return List.of();
        }
        Map<UUID, Long> presentes = ClasseService.paraMapa(
                chamadaRepository.contarPresentesPorAula(aulas.stream().map(Aula::getId).toList()));
        return aulas.stream().map(a -> AulaDTO.of(a, presentes.getOrDefault(a.getId(), 0L))).toList();
    }

    private long contarPresentes(UUID aulaId) {
        return ClasseService.paraMapa(chamadaRepository.contarPresentesPorAula(List.of(aulaId)))
                .getOrDefault(aulaId, 0L);
    }
}
