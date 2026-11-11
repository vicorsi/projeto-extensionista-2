package br.com.ebdgestao.service;

import br.com.ebdgestao.domain.Enums.TipoMembro;
import br.com.ebdgestao.domain.Membro;
import br.com.ebdgestao.dto.CadastroDtos.MembroDTO;
import br.com.ebdgestao.dto.CadastroDtos.MembroRequest;
import br.com.ebdgestao.exception.ApiException;
import br.com.ebdgestao.repository.MembroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MembroService {

    private final MembroRepository repository;
    private final ClasseService classeService;

    @Transactional(readOnly = true)
    public List<MembroDTO> listar(UUID classeId, TipoMembro tipo) {
        List<Membro> membros;
        if (classeId != null && tipo != null) {
            membros = repository.findByClasseIdAndTipoMembroOrderByNomeAsc(classeId, tipo);
        } else if (classeId != null) {
            membros = repository.findByClasseIdOrderByNomeAsc(classeId);
        } else if (tipo != null) {
            membros = repository.findByTipoMembroOrderByNomeAsc(tipo);
        } else {
            membros = repository.findAllByOrderByNomeAsc();
        }
        return membros.stream().map(MembroDTO::of).toList();
    }

    @Transactional
    public MembroDTO criar(MembroRequest req) {
        Membro m = new Membro();
        aplicar(m, req);
        if (m.getAtivo() == null) {
            m.setAtivo(true);
        }
        return MembroDTO.of(repository.save(m));
    }

    @Transactional
    public MembroDTO atualizar(UUID id, MembroRequest req) {
        Membro m = obter(id);
        aplicar(m, req);
        return MembroDTO.of(m);
    }

    @Transactional
    public void excluir(UUID id) {
        repository.delete(obter(id));
    }

    private Membro obter(UUID id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("Aluno não encontrado"));
    }

    private void aplicar(Membro m, MembroRequest req) {
        m.setNome(req.nome().trim());
        m.setClasse(classeService.obter(req.classeId()));
        m.setTipoMembro(req.tipoMembro());
        m.setTelefone(Texto.limpar(req.telefone()));
        if (req.ativo() != null) {
            m.setAtivo(req.ativo());
        }
    }
}
