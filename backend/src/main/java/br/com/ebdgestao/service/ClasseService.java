package br.com.ebdgestao.service;

import br.com.ebdgestao.domain.ClasseEbd;
import br.com.ebdgestao.dto.CadastroDtos.ClasseDTO;
import br.com.ebdgestao.dto.CadastroDtos.ClasseRequest;
import br.com.ebdgestao.exception.ApiException;
import br.com.ebdgestao.repository.ClasseEbdRepository;
import br.com.ebdgestao.repository.MembroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClasseService {

    private final ClasseEbdRepository repository;
    private final MembroRepository membroRepository;
    private final UsuarioService usuarioService;

    @Transactional(readOnly = true)
    public List<ClasseDTO> listar() {
        Map<UUID, Long> totais = paraMapa(membroRepository.contarAtivosPorClasse());
        return repository.findAllByOrderByNomeAsc().stream()
                .map(c -> ClasseDTO.of(c, totais.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    public ClasseEbd obter(UUID id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("Classe não encontrada"));
    }

    @Transactional
    public ClasseDTO criar(ClasseRequest req) {
        ClasseEbd c = new ClasseEbd();
        aplicar(c, req);
        return ClasseDTO.of(repository.save(c), 0L);
    }

    @Transactional
    public ClasseDTO atualizar(UUID id, ClasseRequest req) {
        ClasseEbd c = obter(id);
        aplicar(c, req);
        long total = membroRepository.findByClasseIdAndAtivoTrue(id).size();
        return ClasseDTO.of(c, total);
    }

    @Transactional
    public void excluir(UUID id) {
        repository.delete(obter(id));
    }

    private void aplicar(ClasseEbd c, ClasseRequest req) {
        c.setNome(req.nome().trim());
        c.setFaixaEtaria(Texto.limpar(req.faixaEtaria()));
        c.setDescricao(Texto.limpar(req.descricao()));
        c.setProfessorTitular(req.professorTitularId() == null ? null : usuarioService.obter(req.professorTitularId()));
    }

    static Map<UUID, Long> paraMapa(List<Object[]> linhas) {
        Map<UUID, Long> mapa = new HashMap<>();
        for (Object[] l : linhas) {
            mapa.put((UUID) l[0], ((Number) l[1]).longValue());
        }
        return mapa;
    }
}
