package br.com.ebdgestao.service;

import br.com.ebdgestao.domain.PlanoLicao;
import br.com.ebdgestao.dto.CadastroDtos.PlanoLicaoDTO;
import br.com.ebdgestao.dto.CadastroDtos.PlanoLicaoRequest;
import br.com.ebdgestao.exception.ApiException;
import br.com.ebdgestao.repository.PlanoLicaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlanoLicaoService {

    private final PlanoLicaoRepository repository;
    private final ClasseService classeService;

    @Transactional(readOnly = true)
    public List<PlanoLicaoDTO> listar(UUID classeId) {
        List<PlanoLicao> planos = classeId != null
                ? repository.findByClasseIdOrderByNumeroLicaoAsc(classeId)
                : repository.findAll();
        return planos.stream()
                .map(PlanoLicaoDTO::of)
                .sorted(Comparator.comparing(PlanoLicaoDTO::classeNome, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(PlanoLicaoDTO::numeroLicao, Comparator.nullsLast(Comparator.<Integer>naturalOrder())))
                .toList();
    }

    @Transactional
    public PlanoLicaoDTO criar(PlanoLicaoRequest req) {
        PlanoLicao p = new PlanoLicao();
        aplicar(p, req);
        return PlanoLicaoDTO.of(repository.save(p));
    }

    @Transactional
    public PlanoLicaoDTO atualizar(UUID id, PlanoLicaoRequest req) {
        PlanoLicao p = repository.findById(id).orElseThrow(() -> ApiException.notFound("Lição não encontrada"));
        aplicar(p, req);
        return PlanoLicaoDTO.of(p);
    }

    @Transactional
    public void excluir(UUID id) {
        repository.delete(repository.findById(id).orElseThrow(() -> ApiException.notFound("Lição não encontrada")));
    }

    private void aplicar(PlanoLicao p, PlanoLicaoRequest req) {
        p.setClasse(classeService.obter(req.classeId()));
        p.setNumeroLicao(req.numeroLicao());
        p.setTitulo(req.titulo().trim());
        p.setTextoBiblico(Texto.limpar(req.textoBiblico()));
        p.setDataSugerida(req.dataSugerida());
    }
}
